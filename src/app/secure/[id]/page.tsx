import SecurePageClient from "./securePageClient";

export default async function SecurePage({
  params,
}: {
  params: { id: string };
}) {
  return <SecurePageClient id={params.id} />;
}
