package carddata

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const codeloadBaseURL = "https://codeload.github.com"

// Pin identifies one exact commit of a GitHub repository, written as "owner/repo@commit".
type Pin struct {
	Repo   string
	Commit string
}

// ParsePin parses a pin such as "jchurchman/xwing-data2@0dc446f9...".
func ParsePin(s string) (Pin, error) {
	repo, commit, ok := strings.Cut(strings.TrimSpace(s), "@")
	if !ok || strings.Count(repo, "/") != 1 || commit == "" {
		return Pin{}, fmt.Errorf("invalid pin %q: want owner/repo@commit", s)
	}
	return Pin{Repo: repo, Commit: commit}, nil
}

// Download fetches the pinned commit as a tarball, extracts its data/ directory into destDir,
// and returns the path to use with Load.
func Download(ctx context.Context, client *http.Client, pin Pin, destDir string) (string, error) {
	url := fmt.Sprintf("%s/%s/tar.gz/%s", codeloadBaseURL, pin.Repo, pin.Commit)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}

	res, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("downloading %s: %w", url, err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("downloading %s: %s", url, res.Status)
	}

	return extractData(res.Body, destDir)
}

// extractData unpacks the files under <top-level dir>/data/ from a gzipped tarball and returns
// the path of the extracted top-level directory.
func extractData(r io.Reader, destDir string) (string, error) {
	gz, err := gzip.NewReader(r)
	if err != nil {
		return "", fmt.Errorf("reading tarball: %w", err)
	}
	defer gz.Close()

	tr := tar.NewReader(gz)
	root := ""
	for {
		header, err := tr.Next()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return "", fmt.Errorf("reading tarball: %w", err)
		}
		if header.Typeflag != tar.TypeReg {
			continue
		}

		top, rest, ok := strings.Cut(header.Name, "/")
		if !ok || !strings.HasPrefix(rest, "data/") {
			continue
		}
		root = top

		target := filepath.Join(destDir, filepath.FromSlash(header.Name))
		if !strings.HasPrefix(target, filepath.Clean(destDir)+string(os.PathSeparator)) {
			return "", fmt.Errorf("tarball entry %q escapes the destination directory", header.Name)
		}
		if err := writeFile(target, tr); err != nil {
			return "", err
		}
	}

	if root == "" {
		return "", errors.New("tarball contains no data/ directory")
	}
	return filepath.Join(destDir, root), nil
}

func writeFile(path string, r io.Reader) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	if _, err := io.Copy(f, r); err != nil {
		_ = f.Close() // the copy error is the one worth returning
		return err
	}
	return f.Close()
}
