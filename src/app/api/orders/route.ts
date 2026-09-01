import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const egyptianPhoneRegex = /^01[0125]\d{8}$/;

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
};

function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RS-${timestamp}-${random}`;
}

function isValidPayload(body: unknown): body is OrderPayload {
  if (!body || typeof body !== "object") return false;

  const payload = body as OrderPayload;

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return false;
  }

  if (
    !payload.customer ||
    typeof payload.customer.name !== "string" ||
    typeof payload.customer.phone !== "string"
  ) {
    return false;
  }

  if (
    !payload.shippingAddress ||
    typeof payload.shippingAddress.governorate !== "string" ||
    typeof payload.shippingAddress.city !== "string" ||
    typeof payload.shippingAddress.street !== "string"
  ) {
    return false;
  }

  return payload.items.every(
    (item) =>
      typeof item.productId === "string" &&
      item.productId.length > 0 &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0 &&
      item.quantity <= 100
  );
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (!isValidPayload(body)) {
      return NextResponse.json(
        { error: "بيانات الطلب غير صحيحة" },
        { status: 400 }
      );
    }

    const name = body.customer.name.trim();
    const phone = body.customer.phone.trim();

    const governorate = body.shippingAddress.governorate.trim();
    const city = body.shippingAddress.city.trim();
    const street = body.shippingAddress.street.trim();
    const building = body.shippingAddress.building?.trim() || null;
    const notes = body.notes?.trim() || null;

    if (name.length < 2) {
      return NextResponse.json(
        { error: "الاسم الكامل مطلوب" },
        { status: 400 }
      );
    }

    if (!egyptianPhoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "رقم الهاتف غير صحيح" },
        { status: 400 }
      );
    }

    if (governorate.length < 2) {
      return NextResponse.json(
        { error: "المحافظة مطلوبة" },
        { status: 400 }
      );
    }

    if (city.length < 1) {
      return NextResponse.json(
        { error: "المدينة مطلوبة" },
        { status: 400 }
      );
    }

    if (street.length < 3) {
      return NextResponse.json(
        { error: "العنوان بالتفصيل مطلوب" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const productIds = [...new Set(body.items.map((item) => item.productId))];

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(
        "id, name, name_ar, price, images, stock, is_active"
      )
      .in("id", productIds);

    if (productsError) {
      console.error("Order products query error:", productsError);

      return NextResponse.json(
        { error: "تعذر التحقق من المنتجات" },
        { status: 500 }
      );
    }

    if (!products || products.length !== productIds.length) {
      return NextResponse.json(
        { error: "أحد المنتجات لم يعد متاحًا" },
        { status: 400 }
      );
    }

    const productMap = new Map(
      products.map((product) => [product.id, product])
    );

    const orderItems: {
      product_id: string;
      product_name: string;
      product_image: string | null;
      unit_price: number;
      quantity: number;
      total: number;
    }[] = [];

    let subtotal = 0;

    for (const requestedItem of body.items) {
      const product = productMap.get(requestedItem.productId);

      if (!product) {
        return NextResponse.json(
          { error: "أحد المنتجات غير موجود" },
          { status: 400 }
        );
      }

      if (!product.is_active) {
        return NextResponse.json(
          {
            error: `المنتج "${product.name_ar || product.name}" غير متاح حاليًا`,
          },
          { status: 400 }
        );
      }

      if (
        typeof product.stock === "number" &&
        product.stock < requestedItem.quantity
      ) {
        return NextResponse.json(
          {
            error: `الكمية المطلوبة من "${product.name_ar || product.name}" غير متوفرة`,
          },
          { status: 400 }
        );
      }

      const unitPrice = Number(product.price);

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return NextResponse.json(
          { error: "سعر أحد المنتجات غير صالح" },
          { status: 400 }
        );
      }

      const itemTotal = unitPrice * requestedItem.quantity;

      subtotal += itemTotal;

      orderItems.push({
        product_id: product.id,
        product_name: product.name_ar || product.name,
        product_image:
          Array.isArray(product.images) && product.images.length > 0
            ? product.images[0]
            : null,
        unit_price: unitPrice,
        quantity: requestedItem.quantity,
        total: itemTotal,
      });
    }

    const shippingFee = 0;
    const discount = 0;
    const total = subtotal + shippingFee - discount;
    const orderNumber = generateOrderNumber();

    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: user?.id ?? null,
        status: "pending",
        payment_method: "cod",
        subtotal,
        shipping_fee: shippingFee,
        discount,
        total,
        coupon_code: null,
        shipping_address: {
          governorate,
          city,
          street,
          ...(building ? { building } : {}),
        },
        customer_name: name,
        customer_phone: phone,
        notes,
      })
      .select("id, order_number, total")
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);

      return NextResponse.json(
        { error: "تعذر إنشاء الطلب، حاول مرة أخرى" },
        { status: 500 }
      );
    }

    const orderItemsToInsert = orderItems.map((item) => ({
      order_id: order.id,
      ...item,
    }));

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItemsToInsert);

    if (orderItemsError) {
      console.error("Order items insert error:", orderItemsError);

      await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      return NextResponse.json(
        { error: "تعذر حفظ عناصر الطلب، حاول مرة أخرى" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        orderNumber: order.order_number,
        total: Number(order.total),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/orders error:", error);

    return NextResponse.json(
      { error: "حدث خطأ غير متوقع، حاول مرة أخرى" },
      { status: 500 }
    );
  }
}
