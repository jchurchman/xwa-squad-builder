// Package cardservice implements the CardService API.
package cardservice

import (
	"context"
	"log"

	"connectrpc.com/connect/v2"

	cardsv1 "github.com/jchurchman/xwa-squad-builder/backend/gen/xwa/cards/v1"
	"github.com/jchurchman/xwa-squad-builder/backend/internal/store"
)

// ShipLister is the part of the store the service needs.
type ShipLister interface {
	ListShips(ctx context.Context, factionXWS string) ([]store.FactionShip, error)
}

// Service implements cardsv1connect.CardServiceHandler.
type Service struct {
	ships ShipLister
}

// New returns a Service backed by ships.
func New(ships ShipLister) *Service {
	return &Service{ships: ships}
}

// ListShips returns every ship a faction flies, with that faction's pilots.
func (s *Service) ListShips(ctx context.Context, req *cardsv1.ListShipsRequest) (*cardsv1.ListShipsResponse, error) {
	if req.GetFactionXws() == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, "faction_xws is required")
	}

	ships, err := s.ships.ListShips(ctx, req.GetFactionXws())
	if err != nil {
		log.Printf("listing ships for %q: %v", req.GetFactionXws(), err)
		return nil, connect.NewError(connect.CodeInternal, "could not list ships")
	}

	res := &cardsv1.ListShipsResponse{Ships: make([]*cardsv1.Ship, 0, len(ships))}
	for _, ship := range ships {
		res.Ships = append(res.Ships, factionShipToProto(ship))
	}
	return res, nil
}

func factionShipToProto(ship store.FactionShip) *cardsv1.Ship {
	out := &cardsv1.Ship{Xws: ship.XWS, Name: ship.Name}
	for _, p := range ship.Pilots {
		out.Pilots = append(out.Pilots, &cardsv1.Pilot{
			Xws:        p.XWS,
			Name:       p.Name,
			Initiative: int32(p.Initiative),
		})
	}
	return out
}
