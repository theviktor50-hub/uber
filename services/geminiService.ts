
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getPolitePhrase = async (context: 'no_change' | 'thank_you' | 'missing_money') => {
  const prompts = {
    no_change: "Genera una frase muy corta y amable en español para decirle a un pasajero de Uber que no tienes cambio suficiente en este momento y pedirle si puede pagar con tarjeta o exacto.",
    thank_you: "Genera una frase corta y profesional de agradecimiento en español para un pasajero de Uber después de un viaje.",
    missing_money: "Genera una frase muy educada y corta en español para indicarle al pasajero que el monto entregado es menor al costo del viaje."
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompts[context],
      config: {
        temperature: 0.7,
        maxOutputTokens: 50,
      }
    });
    return response.text?.trim() || "Gracias por su viaje.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Gracias por su viaje.";
  }
};
