import MatriculaClient from "./MatriculaClient";

export async function generateStaticParams() {
  return [
    { fluxo: "EP" },
    { fluxo: "PEDFOR" }
  ];
}

export default function MatriculaPage(props: any) {
  const fluxo = props.params?.fluxo as "EP" | "PEDFOR";
  return <MatriculaClient fluxo={fluxo} />;
}
