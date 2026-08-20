import { NextResponse } from "next/server";
import { products } from "../../../products";

export async function GET() {
  return NextResponse.json(products);
}

export async function POST() {
  return NextResponse.json(
    {
      message: "Products API is ready",
    },
    { status: 200 }
  );
}
