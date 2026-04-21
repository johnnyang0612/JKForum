import { redirect } from "next/navigation";
import { AgeGateModal } from "@/components/age-gate/age-gate-modal";
import { isR18Enabled, hasPassedAgeGate } from "@/lib/age-gate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { next?: string };
}

export default async function AgeGatePage({ searchParams }: Props) {
  const enabled = await isR18Enabled();
  if (!enabled) redirect("/");

  const session = await getServerSession(authOptions);
  const passed = await hasPassedAgeGate(session?.user?.id);
  if (passed) redirect(searchParams.next || "/");

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <AgeGateModal returnTo={searchParams.next || "/"} />
    </div>
  );
}
