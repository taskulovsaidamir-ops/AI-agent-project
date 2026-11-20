import { SettingsClient } from "@/components/settings/settings-client";
import { isRemoteTurso } from "@/db";
import { requireUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await requireUser();
  return <SettingsClient user={user} isRemoteTurso={isRemoteTurso} />;
}
