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

type fakeShips struct {
	ships []store.FactionShip
	err   error
}

func (f fakeShips) ListShips(context.Context, string) ([]store.FactionShip, error) {
	return f.ships, f.err
}

func TestListShipsRequiresFaction(t *testing.T) {
	_, err := New(fakeShips{}).ListShips(context.Background(), &cardsv1.ListShipsRequest{})
	if connect.CodeOf(err) != connect.CodeInvalidArgument {
		t.Fatalf("code = %v, want InvalidArgument", connect.CodeOf(err))
	}
}

func TestListShipsHidesStoreErrors(t *testing.T) {
	svc := New(fakeShips{err: errors.New("disk on fire")})
	_, err := svc.ListShips(context.Background(), &cardsv1.ListShipsRequest{FactionXws: "rebelalliance"})
	if connect.CodeOf(err) != connect.CodeInternal {
		t.Fatalf("code = %v, want Internal", connect.CodeOf(err))
	}
}

func TestListShipsConvertsShips(t *testing.T) {
	svc := New(fakeShips{ships: []store.FactionShip{{
		XWS:    "t65xwing",
		Name:   "T-65 X-wing",
		Pilots: []carddata.Pilot{{XWS: "lukeskywalker", Name: "Luke Skywalker", Initiative: 5}},
	}}})

	res, err := svc.ListShips(context.Background(), &cardsv1.ListShipsRequest{FactionXws: "rebelalliance"})
	if err != nil {
		t.Fatal(err)
	}
	if len(res.GetShips()) != 1 {
		t.Fatalf("got %d ships, want 1", len(res.GetShips()))
	}
	ship := res.GetShips()[0]
	if ship.GetXws() != "t65xwing" || len(ship.GetPilots()) != 1 || ship.GetPilots()[0].GetInitiative() != 5 {
		t.Errorf("unexpected ship %v", ship)
	}
}
