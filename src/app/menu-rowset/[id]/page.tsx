import TrackNadineMasuk from "../track-nadine/components/landing-masuk";

export default function MenuRowsetIdPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params?.id || "";
  return <TrackNadineMasuk initialId={id} autoSearch={true} />;
}
