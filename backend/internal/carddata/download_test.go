package carddata

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"os"
	"path/filepath"
	"testing"
)

func makeTarball(t *testing.T, files map[string]string) *bytes.Buffer {
	t.Helper()
	var buf bytes.Buffer
	gz := gzip.NewWriter(&buf)
	tw := tar.NewWriter(gz)
	for name, body := range files {
		header := &tar.Header{Name: name, Mode: 0o644, Size: int64(len(body)), Typeflag: tar.TypeReg}
		if err := tw.WriteHeader(header); err != nil {
			t.Fatal(err)
		}
		if _, err := tw.Write([]byte(body)); err != nil {
			t.Fatal(err)
		}
	}
	if err := tw.Close(); err != nil {
		t.Fatal(err)
	}
	if err := gz.Close(); err != nil {
		t.Fatal(err)
	}
	return &buf
}

func TestExtractDataKeepsOnlyDataDirectory(t *testing.T) {
	dest := t.TempDir()
	tarball := makeTarball(t, map[string]string{
		"xwing-data2-abc/data/manifest.json": "{}",
		"xwing-data2-abc/README.md":          "readme",
	})

	root, err := extractData(tarball, dest)
	if err != nil {
		t.Fatal(err)
	}
	if want := filepath.Join(dest, "xwing-data2-abc"); root != want {
		t.Errorf("root = %q, want %q", root, want)
	}
	if _, err := os.Stat(filepath.Join(root, "data", "manifest.json")); err != nil {
		t.Errorf("manifest not extracted: %v", err)
	}
	if _, err := os.Stat(filepath.Join(root, "README.md")); !os.IsNotExist(err) {
		t.Errorf("README.md should not be extracted, stat err = %v", err)
	}
}

func TestExtractDataRejectsPathTraversal(t *testing.T) {
	tarball := makeTarball(t, map[string]string{
		"xwing-data2-abc/data/../../../escaped.txt": "nope",
	})

	if _, err := extractData(tarball, t.TempDir()); err == nil {
		t.Fatal("expected an error for an entry escaping the destination")
	}
}
