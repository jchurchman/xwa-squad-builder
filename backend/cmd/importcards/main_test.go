package main

import "testing"

func TestAMGPointsLabel(t *testing.T) {
	got := amgPointsLabel("3.9.1", "0dc446f936e8a3f586195e372e5c31d6a62b78d4")
	if want := "xwing-data2 3.9.1 @0dc446f"; got != want {
		t.Errorf("amgPointsLabel = %q, want %q", got, want)
	}
}
