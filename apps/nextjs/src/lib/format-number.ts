// Currency symbols mapping for Notion number formats
const currencySymbols: Record<string, string> = {
  // Currencies
  argentine_peso: "ARS $",
  australian_dollar: "A$",
  baht: "฿",
  canadian_dollar: "C$",
  chilean_peso: "CLP $",
  colombian_peso: "COL $",
  danish_krone: "kr",
  dirham: "AED",
  dollar: "$",
  euro: "€",
  forint: "Ft",
  franc: "CHF",
  hong_kong_dollar: "HK$",
  koruna: "Kč",
  krona: "kr",
  leu: "lei",
  lira: "₺",
  mexican_peso: "MX$",
  new_taiwan_dollar: "NT$",
  new_zealand_dollar: "NZ$",
  norwegian_krone: "kr",
  peruvian_sol: "S/",
  philippine_peso: "₱",
  pound: "£",
  rand: "R",
  real: "R$",
  ringgit: "RM",
  riyal: "﷼",
  ruble: "₽",
  rupee: "₹",
  rupiah: "Rp",
  shekel: "₪",
  singapore_dollar: "S$",
  uruguayan_peso: "UYU $",
  won: "₩",
  yen: "¥",
  yuan: "¥",
  zloty: "zł",
};

export type NotionNumberFormat =
  | "argentine_peso"
  | "australian_dollar"
  | "baht"
  | "canadian_dollar"
  | "chilean_peso"
  | "colombian_peso"
  | "danish_krone"
  | "dirham"
  | "dollar"
  | "euro"
  | "forint"
  | "franc"
  | "hong_kong_dollar"
  | "koruna"
  | "krona"
  | "leu"
  | "lira"
  | "mexican_peso"
  | "new_taiwan_dollar"
  | "new_zealand_dollar"
  | "norwegian_krone"
  | "number"
  | "number_with_commas"
  | "percent"
  | "peruvian_sol"
  | "philippine_peso"
  | "pound"
  | "rand"
  | "real"
  | "ringgit"
  | "riyal"
  | "ruble"
  | "rupee"
  | "rupiah"
  | "shekel"
  | "singapore_dollar"
  | "uruguayan_peso"
  | "yen"
  | "yuan"
  | "won"
  | "zloty";

/**
 * Formats a number according to Notion's number property format
 * @param value - The number to format
 * @param format - The Notion number format type
 * @returns Formatted number string
 */
export function formatNotionNumber(
  value: number | null | undefined,
  format: NotionNumberFormat = "number",
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0";
  }

  switch (format) {
    case "percent":
      return `${(value * 100).toFixed(1)}%`;

    case "number_with_commas":
      return value.toLocaleString();

    case "number":
      return value.toString();

    default: {
      // Handle currency formats
      const symbol = currencySymbols[format];
      if (symbol) {
        // Format with appropriate decimal places and thousands separators
        const formattedValue = value.toLocaleString(undefined, {
          minimumFractionDigits: value % 1 === 0 ? 0 : 2,
          maximumFractionDigits: 2,
        });
        return `${symbol}${formattedValue}`;
      }

      // Fallback to plain number
      return value.toString();
    }
  }
}
