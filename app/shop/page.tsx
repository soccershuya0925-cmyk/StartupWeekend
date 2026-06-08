// /shop は廃止（方針転換: 食品販売・補充の要素は出さない）。
// 既存リンク/ブックマーク対策として 404 ではなくレシピへリダイレクトする。
import { redirect } from "next/navigation";

export default function ShopPage() {
  redirect("/recipe");
}
