import { requireAdminSession } from "@/utils/serverAuth";
import AdminPanel from "./AdminPanel";

export const metadata = {
  title: "Administración | Presenton",
};

export default async function AdminPage() {
  await requireAdminSession();
  return <AdminPanel />;
}
