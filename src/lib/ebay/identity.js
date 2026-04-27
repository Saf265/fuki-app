"use server"

export async function getUserMarketplace(token) {
  // ATTENTION : Identity = api.sandbox (pas de 'z')
  const url = "https://api.sandbox.ebay.com/commerce/identity/v1/user/";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Erreur Identity API:", errorText);
    return null;
  }

  const data = await response.json();

  // Le champ exact renvoyé par eBay est registrationMarketplaceId

  return { marketplaceId: data.registrationMarketplaceId, username: data?.userId } // Exemple: "EBAY_FR"
}

export async function fetchUserEbayPolicies(token, marketplaceId) {

  // Base URL pour les Sell APIs en Sandbox
  const baseUrl = "https://apiz.sandbox.ebay.com/sell/account/v1";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    // On lance les 3 requêtes en parallèle pour gagner du temps
    const [fulfillmentRes, paymentRes, returnRes] = await Promise.all([
      fetch(`${baseUrl}/fulfillment_policy?marketplace_id=${marketplaceId}`, { headers }),
      fetch(`${baseUrl}/payment_policy?marketplace_id=${marketplaceId}`, { headers }),
      fetch(`${baseUrl}/return_policy?marketplace_id=${marketplaceId}`, { headers }),
    ]);

    // Vérification basique des erreurs
    if (!fulfillmentRes.ok || !paymentRes.ok || !returnRes.ok) {
      throw new Error("Erreur lors de la récupération des politiques eBay");
    }

    const [fulfillmentData, paymentData, returnData] = await Promise.all([
      fulfillmentRes.json(),
      paymentRes.json(),
      returnRes.json(),
    ]);

    return {
      success: true,
      policies: {
        fulfillment: fulfillmentData.fulfillmentPolicies || [], // Liste des livraisons
        payment: paymentData.paymentPolicies || [],           // Liste des paiements
        return: returnData.returnPolicies || [],               // Liste des retours
      }
    };

  } catch (error) {
    console.error("Ebay Policy Fetch Error:", error);
    return { success: false, message: "Impossible de charger les politiques." };
  }
}