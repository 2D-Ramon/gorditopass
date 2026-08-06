import { redirect } from "next/navigation";

/** Combined into /membership */
export default function ForDinersRedirect() {
  redirect("/membership");
}
