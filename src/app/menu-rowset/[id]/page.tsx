import TrackNadineMasuk from "../track-nadine/components/landing-masuk";

export default async function MenuRowsetIdPage({
  params,
}: {
  params?: Promise<{ id?: string }>;
}) {
  const resolvedParams = await params;
  const id = resolvedParams?.id ?? "";
  return <TrackNadineMasuk initialId={id} autoSearch={true} />;
}
