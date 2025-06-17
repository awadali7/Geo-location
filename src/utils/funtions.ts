export function getFirstTwoLetters(str: string | null | undefined): string {
	if (!str || typeof str !== "string") return "";
	// take first word, then its first two letters
	const firstWord = str.trim().split(/\s+/)[0];
	return firstWord.slice(0, 2).toUpperCase();
}

export function toZuluISOString(localDateTime: string): string {
	const dt = new Date(localDateTime);
	if (isNaN(dt.getTime())) {
		throw new Error(`Invalid date string: "${localDateTime}"`);
	}
	return dt.toISOString();
}

export function titleCase(str: string) {
	return (
		str
			.toLowerCase()
			// split on spaces or dots (you can add more delimiters as needed)
			.split(/[\s.]+/)
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(" ")
	);
}

export function formatDate(isoString: string) {
	const date = new Date(isoString);

	const day = String(date.getDate()).padStart(2, "0");
	const monthAbbr = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	][date.getMonth()];
	const year = date.getFullYear();

	return `${day} ${monthAbbr} ${year}`;
}
