import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const egyptianPhoneRegex = /^01[0125]\d{8}$/;

const MAX_BODY_BYTES = 50_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;

const rateLimitMap = new Map<
  string,
  { count: number; resetAt: number }
>();

type OrderItemInput = {
  productId: string;
  quantity: number;
};

type OrderPayload = {
  items: OrderItemInput[];
  customer: {
    name: string;
    phone: string;
  };
  shippingAddress: {
    governorate: string;
    city: string;
    street: string;
    building?: string;
  };
  notes?: string;
  idempotencyKey?: string;
};

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count += 1;
  return true;
}

function cleanupRateLimitMap() {
  const now = Date.now();

  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

  return `RS-${timestamp}-${random}`;
}

function isValidPayload(body: unknown): body is OrderPayload {
  if (!body || typeof body !== "object") {
    return false;
  }

  const payload = body as OrderPayload;

  if (!Array.isArray(payload.items)) {
    return false;
  }

  if (payload.items.length === 0 || payload.items.length > 30) {
    return false;
  }

  if (
    !payload.customer ||
    typeof payload.customer !== "object" ||
    typeof payload.customer.name !== "string" ||
    typeof payload.customer.phone !== "string"
  ) {
    return false;
  }

  if (
    !payload.shippingAddress ||
    typeof payload.shippingAddress !== "object" ||
    typeof payload.shippingAddress.governorate !== "string" ||
    typeof payload.shippingAddress.city !== "string" ||
    typeof payload.shippingAddress.street !== "string"
  ) {
    return false;
  }

  if (
    payload.shippingAddress.building !== undefined &&
    typeof payload.shippingAddress.building !== "string"
  ) {
    return false;
  }

  if (
    payload.notes !== undefined &&
    typeof payload.notes !== "string"
  ) {
    return false;
  }

  if (
    payload.idempotencyKey !== undefined &&
    typeof payload.idempotencyKey !== "string"
  ) {
    return false;
  }

  return payload.items.every((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    return (
      typeof item.productId === "string" &&
      item.productId.length > 0 &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0 &&
      item.quantity <= 100
    );
  });
}

export async function POST(request: NextRequest) {
  try {
    // --------------------------------------------------
    // 1. Rate limiting
    // --------------------------------------------------

    cleanupRateLimitMap();

    const ip = getClientIp(request);

    if (!checkRateLimit(ip)) {
      console.warn(`[orders] rate limit exceeded for IP: ${ip}`);

      return NextResponse.json(
        {
          error: "عدد الطلبات كبير جدًا، حاول بعد قليل",
        },
        { status: 429 }
      );
    }

    // --------------------------------------------------
    // 2. Body size protection
    // --------------------------------------------------

    const contentLength = request.headers.get("content-length");

    if (contentLength) {
      const parsedLength = Number.parseInt(contentLength, 10);

      if (
        Number.isFinite(parsedLength) &&
        parsedLength > MAX_BODY_BYTES
      ) {
        return NextResponse.json(
          {
            error: "حجم الطلب كبير جدًا",
          },
          { status: 413 }
        );
      }
    }

    const rawBody = await request.text();

    const bodySize = new TextEncoder().encode(rawBody).byteLength;

    if (bodySize > MAX_BODY_BYTES) {
      return NextResponse.json(
        {
          error: "حجم الطلب كبير جدًا",
        },
        { status: 413 }
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          error: "بيانات الطلب غير صحيحة",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. Strict payload validation
    // --------------------------------------------------

    if (!isValidPayload(body)) {
      return NextResponse.json(
        {
          error: "بيانات الطلب غير صحيحة",
        },
        { status: 400 }
      );
    }

    const name = body.customer.name.trim();
    const phone = body.customer.phone.trim();

    const governorate =
      body.shippingAddress.governorate.trim();

    const city =
      body.shippingAddress.city.trim();

    const street =
      body.shippingAddress.street.trim();

    const building =
      body.shippingAddress.building?.trim() || null;

    const notes =
      body.notes?.trim() || null;

    // --------------------------------------------------
    // 4. Normalized field validation
    // --------------------------------------------------

    if (name.length < 2 || name.length > 120) {
      return NextResponse.json(
        {
          error: "الاسم الكامل مطلوب",
        },
        { status: 400 }
      );
    }

    if (!egyptianPhoneRegex.test(phone)) {
      return NextResponse.json(
        {
          error: "رقم الهاتف غير صحيح",
        },
        { status: 400 }
      );
    }

    if (governorate.length < 2) {
      return NextResponse.json(
        {
          error: "المحافظة مطلوبة",
        },
        { status: 400 }
      );
    }

    if (governorate.length > 100) {
      return NextResponse.json(
        {
          error: "اسم المحافظة طويل جدًا",
        },
        { status: 400 }
      );
    }

    if (city.length < 1 || city.length > 100) {
      return NextResponse.json(
        {
          error: "المدينة غير صحيحة",
        },
        { status: 400 }
      );
    }

    if (street.length < 3 || street.length > 300) {
      return NextResponse.json(
        {
          error: "العنوان بالتفصيل غير صحيح",
        },
        { status: 400 }
      );
    }

    if (building && building.length > 100) {
      return NextResponse.json(
        {
          error: "رقم المبنى غير صحيح",
        },
        { status: 400 }
      );
    }

    if (notes && notes.length > 1000) {
      return NextResponse.json(
        {
          error: "الملاحظات طويلة جدًا",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 5. Idempotency key
    // Header takes precedence over body.
    // --------------------------------------------------

    const headerKey =
      request.headers.get("Idempotency-Key")?.trim() || null;

    const bodyKey =
      body.idempotencyKey?.trim() || null;

    let idempotencyKey = headerKey || bodyKey;

    if (headerKey && bodyKey && headerKey !== bodyKey) {
      return NextResponse.json(
        {
          error: "مفتاح التكرار غير متطابق",
        },
        { status: 400 }
      );
    }

    if (idempotencyKey) {
      if (
        idempotencyKey.length < 8 ||
        idempotencyKey.length > 100
      ) {
        return NextResponse.json(
          {
            error: "مفتاح التكرار غير صالح",
          },
          { status: 400 }
        );
      }
    }

    // --------------------------------------------------
    // 6. Server-side order number
    // --------------------------------------------------

    const orderNumber = generateOrderNumber();

    // --------------------------------------------------
    // 7. Atomic RPC only
    // --------------------------------------------------

    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc(
      "create_order_atomic",
      {
        p_items: body.items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),

        p_customer_name: name,

        p_customer_phone: phone,

        p_shipping_address: {
          governorate,
          city,
          street,
          ...(building ? { building } : {}),
        },

        p_notes: notes,

        p_user_id: null,

        p_idempotency_key: idempotencyKey,

        p_order_number: orderNumber,
      }
    );

    // --------------------------------------------------
    // 8. RPC error mapping
    // --------------------------------------------------

    if (error) {
      const msg = error.message || "";

      if (
        msg.includes("OUT_OF_STOCK") ||
        msg.includes("OUT_OF_STOCK_RACE")
      ) {
        return NextResponse.json(
          {
            error: "الكمية المطلوبة غير متوفرة",
          },
          { status: 409 }
        );
      }

      if (msg.includes("PRODUCT_INACTIVE")) {
        return NextResponse.json(
          {
            error: "أحد المنتجات غير متاح حاليًا",
          },
          { status: 400 }
        );
      }

      if (msg.includes("PRODUCT_NOT_FOUND")) {
        return NextResponse.json(
          {
            error: "أحد المنتجات لم يعد متاحًا",
          },
          { status: 400 }
        );
      }

      if (
        msg.includes(
          "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD"
        )
      ) {
        return NextResponse.json(
          {
            error: "مفتاح التكرار مستخدم مع طلب مختلف",
          },
          { status: 409 }
        );
      }

      if (msg.includes("INVALID_IDEMPOTENCY_KEY")) {
        return NextResponse.json(
          {
            error: "مفتاح التكرار غير صالح",
          },
          { status: 400 }
        );
      }

      if (
        msg.includes("INVALID_") ||
        msg.includes("TOO_MANY_ITEMS")
      ) {
        return NextResponse.json(
          {
            error: "بيانات الطلب غير صحيحة",
          },
          { status: 400 }
        );
      }

      console.error(
        "create_order_atomic error:",
        error
      );

      return NextResponse.json(
        {
          error: "تعذر إنشاء الطلب، حاول مرة أخرى",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 9. Validate RPC response
    // --------------------------------------------------

    if (
      !data ||
      typeof data !== "object" ||
      !data.order_number
    ) {
      return NextResponse.json(
        {
          error: "تعذر إنشاء الطلب، حاول مرة أخرى",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 10. Final response
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        orderNumber: data.order_number,
        total: Number(data.total),
        idempotent: Boolean(data.idempotent),
      },
      {
        status: data.idempotent ? 200 : 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/orders error:",
      error
    );

    return NextResponse.json(
      {
        error: "حدث خطأ غير متوقع، حاول مرة أخرى",
      },
      { status: 500 }
    );
  }
}
