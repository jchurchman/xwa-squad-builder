package cardservice

import (
	"context"
	"errors"
	"testing"

	"connectrpc.com/connect/v2"

	cardsv1 "github.com/jchurchman/xwa-squad-builder/backend/gen/xwa/cards/v1"
	"github.com/jchurchman/xwa-squad-builder/backend/internal/carddata"
	"github.com/jchurchman/xwa-squad-builder/backend/internal/store"
)

type fakeCards struct {
	ships    []store.FactionShip
	upgrades []carddata.Upgrade
	err      error
}

func (f fakeCards) ListShips(context.Context, string) ([]store.FactionShip, error) {
	return f.ships, f.err
}

func (f fakeCards) ListUpgrades(context.Context) ([]carddata.Upgrade, error) {
	return f.upgrades, f.err
}

func TestListShipsRequiresFaction(t *testing.T) {
	_, err := New(fakeCards{}).ListShips(context.Background(), &cardsv1.ListShipsRequest{})
	if connect.CodeOf(err) != connect.CodeInvalidArgument {
		t.Fatalf("code = %v, want InvalidArgument", connect.CodeOf(err))
	}
}

func TestStoreErrorsAreHidden(t *testing.T) {
	svc := New(fakeCards{err: errors.New("disk on fire")})

	_, err := svc.ListShips(context.Background(), &cardsv1.ListShipsRequest{FactionXws: "rebelalliance"})
	if connect.CodeOf(err) != connect.CodeInternal {
		t.Errorf("ListShips code = %v, want Internal", connect.CodeOf(err))
	}

	_, err = svc.ListUpgrades(context.Background(), &cardsv1.ListUpgradesRequest{})
	if connect.CodeOf(err) != connect.CodeInternal {
		t.Errorf("ListUpgrades code = %v, want Internal", connect.CodeOf(err))
	}
}

func TestListShipsConvertsShips(t *testing.T) {
	svc := New(fakeCards{ships: []store.FactionShip{{
		Ship: carddata.Ship{
			XWS: "t65xwing", Name: "T-65 X-wing", Size: "Small",
			Actions: []carddata.Action{{Type: "Focus", Difficulty: "White"}},
		},
		Pilots: []carddata.Pilot{{
			XWS: "lukeskywalker", Name: "Luke Skywalker", Initiative: 5, Limited: 1,
			Slots: []string{"Force Power"}, ForceSides: []string{"light"},
		}},
	}}})

	res, err := svc.ListShips(context.Background(), &cardsv1.ListShipsRequest{FactionXws: "rebelalliance"})
	if err != nil {
		t.Fatal(err)
	}
	if len(res.GetShips()) != 1 {
		t.Fatalf("got %d ships, want 1", len(res.GetShips()))
	}
	ship := res.GetShips()[0]
	if ship.GetSize() != "Small" || ship.GetActions()[0].GetType() != "Focus" {
		t.Errorf("unexpected ship %v", ship)
	}
	pilot := ship.GetPilots()[0]
	if pilot.GetLimited() != 1 || pilot.GetSlots()[0] != "Force Power" || pilot.GetForceSides()[0] != "light" {
		t.Errorf("unexpected pilot %v", pilot)
	}
}

func TestListUpgradesConvertsRestrictions(t *testing.T) {
	nonLimited := false
	svc := New(fakeCards{upgrades: []carddata.Upgrade{{
		XWS: "000", Name: "0-0-0", Slots: []string{"Crew"}, Limited: 1,
		Restrictions: []carddata.RestrictionGroup{
			{Factions: []string{"scumandvillainy"}, Names: []string{"Darth Vader"}},
			{Actions: []carddata.Action{{Type: "Calculate"}}, NonLimited: &nonLimited},
		},
	}}})

	res, err := svc.ListUpgrades(context.Background(), &cardsv1.ListUpgradesRequest{})
	if err != nil {
		t.Fatal(err)
	}
	groups := res.GetUpgrades()[0].GetRestrictions()
	if len(groups) != 2 {
		t.Fatalf("got %d restriction groups, want 2", len(groups))
	}
	if groups[0].GetNames()[0] != "Darth Vader" || groups[1].GetActions()[0].GetType() != "Calculate" {
		t.Errorf("unexpected restrictions %v", groups)
	}
	if groups[1].NonLimited == nil || groups[1].GetNonLimited() {
		t.Errorf("non_limited = %v, want explicitly false", groups[1].NonLimited)
	}
}
