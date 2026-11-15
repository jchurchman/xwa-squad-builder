package pointsservice

import (
	"context"
	"errors"
	"testing"

	"connectrpc.com/connect/v2"

	pointsv1 "github.com/jchurchman/xwa-squad-builder/backend/gen/xwa/points/v1"
	"github.com/jchurchman/xwa-squad-builder/backend/internal/carddata"
	"github.com/jchurchman/xwa-squad-builder/backend/internal/store"
)

type fakeVersions struct {
	version *store.PointsVersion
	err     error
}

func (f fakeVersions) LatestPublishedPointsVersion(context.Context, string) (*store.PointsVersion, error) {
	return f.version, f.err
}

func TestGetPointsVersionErrors(t *testing.T) {
	tests := map[string]struct {
		source   string
		versions fakeVersions
		want     connect.Code
	}{
		"unknown source":  {source: "fantasy", want: connect.CodeInvalidArgument},
		"no version yet":  {source: "xwa", versions: fakeVersions{err: store.ErrNoPointsVersion}, want: connect.CodeNotFound},
		"store error":     {source: "amg", versions: fakeVersions{err: errors.New("disk on fire")}, want: connect.CodeInternal},
		"source required": {source: "", want: connect.CodeInvalidArgument},
	}
	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			_, err := New(tt.versions).GetPointsVersion(context.Background(), &pointsv1.GetPointsVersionRequest{Source: tt.source})
			if got := connect.CodeOf(err); got != tt.want {
				t.Errorf("code = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestGetPointsVersionConvertsCosts(t *testing.T) {
	three := 3
	svc := New(fakeVersions{version: &store.PointsVersion{
		Source: "amg", Label: "xwing-data2 3.9.1 @0dc446f", MaxListPoints: 20,
		Pilots: []carddata.PilotCost{{PilotXWS: "lukeskywalker", Cost: 6, Loadout: 10, Slots: []string{"Talent"}, Formats: []string{"epic"}}},
		Upgrades: []carddata.UpgradeCost{
			{UpgradeXWS: "000", Cost: &three, Formats: []string{"epic"}},
			{UpgradeXWS: "combatboardingtube"},
		},
	}})

	res, err := svc.GetPointsVersion(context.Background(), &pointsv1.GetPointsVersionRequest{Source: "amg"})
	if err != nil {
		t.Fatal(err)
	}
	v := res.GetVersion()
	if v.GetLabel() != "xwing-data2 3.9.1 @0dc446f" || v.GetMaxListPoints() != 20 {
		t.Errorf("version = %v", v)
	}
	if p := v.GetPilotCosts()[0]; p.GetCost() != 6 || p.GetLoadout() != 10 || p.GetSlots()[0] != "Talent" {
		t.Errorf("pilot cost = %v", p)
	}
	priced, unpriced := v.GetUpgradeCosts()[0], v.GetUpgradeCosts()[1]
	if priced.Cost == nil || priced.GetCost() != 3 {
		t.Errorf("priced upgrade = %v, want cost 3", priced)
	}
	if unpriced.Cost != nil {
		t.Errorf("unpriced upgrade = %v, want no cost", unpriced)
	}
}
