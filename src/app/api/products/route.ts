import { NextResponse } from "next/server";
import { products } from "../../products";

export async function GET() {
  return NextResponse.json(products);
}

export async function POST() {
  return NextResponse.json(
    {
      message:
        "واجهة المنتجات جاهزة. سنضيف الحفظ الدائم من لوحة التحكم في الخطوة التالية.",
    },
    { status: 200 }
  );
}
