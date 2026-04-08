import { NextResponse } from "next/server";

export function proxy(request) {
  // 1. On intercepte la réponse pour y ajouter nos headers
  const response = NextResponse.next();

  // 2. Configuration CORS pour autoriser l'extension sur Vinted
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  // 3. Gestion du Preflight (le fameux OPTIONS 204 que tu vois dans tes logs)
  // Le navigateur envoie OPTIONS avant le POST, il faut répondre OK avec les headers
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    });
  }

  return response;
}

// 4. On cible uniquement tes routes API pour ne pas ralentir le reste du site
export const config = {
  matcher: "/api/:path*",
};
