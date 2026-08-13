import { redirect } from "next/navigation";

export default function ProfessionalRegistrationPage() {
  redirect("/register?type=professional");
}
