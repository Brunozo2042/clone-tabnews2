import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <Database />
    </>
  );
}

function UpdatedAt() {
  const response = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAt = "Carregando...";

  if (!response.isLoading && response.data) {
    updatedAt = new Date(response.data.updated_at).toLocaleString("pt-BR");
  }

  return (
    <pre>
      Última atualização: <strong>{updatedAt}</strong>
    </pre>
  );
}

function Database() {
  const response = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let version = "Carregando...";
  let max_connections = "Carregando...";
  let opened_connections = "Carregando...";

  if (!response.isLoading && response.data) {
    version = response.data.dependecies.database.version;
    max_connections = response.data.dependecies.database.max_connections;
    opened_connections = response.data.dependecies.database.opened_connections;
  }

  return (
    <>
      <h2>Database</h2>
      <pre>
        Version: <strong>{version}</strong>
      </pre>
      <pre>
        Máximo de conexões: <strong>{max_connections}</strong>
      </pre>
      <pre>
        Conexões abertas: <strong>{opened_connections}</strong>
      </pre>
    </>
  );
}
