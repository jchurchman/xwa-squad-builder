// Package cardservice implements the CardService API.
package cardservice

import (
	"context"
	"log"

	"connectrpc.com/connect/v2"

	cardsv1 "github.com/jchurchman/xwa-squad-builder/backend/gen/xwa/cards/v1"
	"github.com/jchurchman/xwa-squad-builder/backend/internal/carddata"
	"github.com/jchurchman/xwa-squad-builder/backend/internal/store"
)

// CardStore is the part of the store the service needs.
type CardStore interface {
	ListShips(ctx context.Context, factionXWS string) ([]store.FactionShip, error)
	ListUpgrades(ctx context.Context) ([]carddata.Upgrade, error)
}

// Service implements cardsv1connect.CardServiceHandler.
type Service struct {
	cards CardStore
}

// New returns a Service backed by cards.
func New(cards CardStore) *Service {
	return &Service{cards: cards}
}

// ListShips returns every ship a faction flies, with that faction's pilots.
func (s *Service) ListShips(ctx context.Context, req *cardsv1.ListShipsRequest) (*cardsv1.ListShipsResponse, error) {
	if req.GetFactionXws() == "" {
		return nil, connect.NewError(connect.CodeInvalidArgument, "faction_xws is required")
	}

	ships, err := s.cards.ListShips(ctx, req.GetFactionXws())
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

// ListUpgrades returns every upgrade card.
func (s *Service) ListUpgrades(ctx context.Context, _ *cardsv1.ListUpgradesRequest) (*cardsv1.ListUpgradesResponse, error) {
	upgrades, err := s.cards.ListUpgrades(ctx)
	if err != nil {
		log.Printf("listing upgrades: %v", err)
		return nil, connect.NewError(connect.CodeInternal, "could not list upgrades")
	}

	res := &cardsv1.ListUpgradesResponse{Upgrades: make([]*cardsv1.Upgrade, 0, len(upgrades))}
	for _, u := range upgrades {
		res.Upgrades = append(res.Upgrades, upgradeToProto(u))
	}
	return res, nil
}

func factionShipToProto(ship store.FactionShip) *cardsv1.Ship {
	out := &cardsv1.Ship{
		Xws:     ship.XWS,
		Name:    ship.Name,
		Size:    ship.Size,
		Actions: actionsToProto(ship.Actions),
		Arcs:    ship.Arcs,
	}
	for _, p := range ship.Pilots {
		out.Pilots = append(out.Pilots, &cardsv1.Pilot{
			Xws:             p.XWS,
			Name:            p.Name,
			Initiative:      int32(p.Initiative),
			Limited:         int32(p.Limited),
			Slots:           p.Slots,
			StandardLoadout: p.StandardLoadout,
			Keywords:        p.Keywords,
			ShipAbility:     p.ShipAbility,
			ShipActions:     actionsToProto(p.ShipActions),
			ForceSides:      p.ForceSides,
		})
	}
	return out
}

func upgradeToProto(u carddata.Upgrade) *cardsv1.Upgrade {
	out := &cardsv1.Upgrade{
		Xws:                 u.XWS,
		Name:                u.Name,
		Slots:               u.Slots,
		Limited:             int32(u.Limited),
		StandardLoadoutOnly: u.StandardLoadoutOnly,
	}
	for _, g := range u.Restrictions {
		out.Restrictions = append(out.Restrictions, &cardsv1.RestrictionGroup{
			Factions:      g.Factions,
			Ships:         g.Ships,
			Sizes:         g.Sizes,
			Actions:       actionsToProto(g.Actions),
			Keywords:      g.Keywords,
			ShipAbilities: g.ShipAbilities,
			Names:         g.Names,
			Equipped:      g.Equipped,
			Arcs:          g.Arcs,
			ForceSides:    g.ForceSides,
			Solitary:      g.Solitary,
			Standardized:  g.Standardized,
			NonLimited:    g.NonLimited,
		})
	}
	return out
}

func actionsToProto(actions []carddata.Action) []*cardsv1.Action {
	out := make([]*cardsv1.Action, 0, len(actions))
	for _, a := range actions {
		out = append(out, &cardsv1.Action{Type: a.Type, Difficulty: a.Difficulty})
	}
	return out
}
