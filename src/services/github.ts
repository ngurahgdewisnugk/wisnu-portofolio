export interface GithubContributions {
  username: string;
  totalContributions: number;
  contributions: Record<string, number>;
  startDate: string;
  endDate: string;
}

/** Client-side fetch of the contribution calendar via our own API route. */
export const fetchGithubContributions = async (
  username: string
): Promise<GithubContributions | null> => {
  try {
    const response = await fetch(
      `/api/github/contributions?username=${encodeURIComponent(username)}`
    );
    if (!response.ok) {
      throw new Error(`Contributions API responded ${response.status}`);
    }
    return (await response.json()) as GithubContributions;
  } catch (error) {
    console.error("Error fetching GitHub contributions:", error);
    return null;
  }
};
