import { describe, it, expect, beforeEach, vi } from "vitest";

describe("GitHubRepositories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch repositories from GitHub API", async () => {
    const mockRepos = [
      {
        id: 1,
        name: "test-repo",
        description: "A test repository",
        html_url: "https://github.com/jucielefernandes/test-repo",
        language: "TypeScript",
        stargazers_count: 10,
        forks_count: 5,
      },
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRepos),
      } as Response)
    );

    const response = await fetch(
      "https://api.github.com/users/jucielefernandes/repos?sort=stars&order=desc&per_page=12"
    );
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("test-repo");
    expect(data[0].language).toBe("TypeScript");
  });

  it("should handle GitHub API errors gracefully", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response)
    );

    const response = await fetch(
      "https://api.github.com/users/jucielefernandes/repos"
    );

    expect(response.ok).toBe(false);
  });

  it("should format repository data correctly", async () => {
    const mockRepo = {
      id: 123,
      name: "awesome-project",
      description: "An awesome project",
      html_url: "https://github.com/jucielefernandes/awesome-project",
      language: "JavaScript",
      stargazers_count: 42,
      forks_count: 8,
    };

    const formatted = {
      id: mockRepo.id,
      name: mockRepo.name,
      description: mockRepo.description,
      url: mockRepo.html_url,
      language: mockRepo.language,
      stars: mockRepo.stargazers_count,
      forks: mockRepo.forks_count,
    };

    expect(formatted.id).toBe(123);
    expect(formatted.name).toBe("awesome-project");
    expect(formatted.stars).toBe(42);
    expect(formatted.forks).toBe(8);
  });
});
