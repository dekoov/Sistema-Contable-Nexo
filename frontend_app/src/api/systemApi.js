import apiClient from "./apiClient";

export async function getServerInstance() {
  const response = await apiClient.get("/system/instance");
  return response.data;
}
