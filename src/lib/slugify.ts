/**
 * Generates an SEO-friendly URL slug from a given string.
 * Supports both Arabic and English characters.
 */
export function slugify(text: string): string {
    if (!text) return "";

    return text
        .toString()
        .trim()
        .toLowerCase()
        // Replace Tashkeel (Arabic diacritics)
        .replace(/[\u064B-\u0652]/g, "")
        // Replace spaces and special characters with hyphens
        .replace(/[\s\t\r\n_\-\+\.\,\!\@\#\$\%\^\&\*\(\)\{\}\[\]\:\;\'\"\<Ref\>\?\/\\\|\`\~]+/g, "-")
        // Keep only Arabic letters (\u0621-\u064A), numbers (\u0660-\u0669), English letters, numbers, and hyphens
        .replace(/[^\u0621-\u064Aa-zA-Z0-9\-]/g, "")
        // Replace multiple hyphens with a single one
        .replace(/\-+/g, "-")
        // Trim hyphens from the start and end
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}
