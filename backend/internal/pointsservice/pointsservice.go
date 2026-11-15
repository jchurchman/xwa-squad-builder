// Package pointsservice implements the PointsService API.
package pointsservice

import (
	"context"
	"errors"
	"log"

	"connectrpc.com/connect/v2"

	pointsv1 "github.com/jchurchman/xwa-squad-builder/backend/gen/xwa/points/v1"
	"github.com/jchurchman/xwa-squad-builder/backend/internal/carddata"
	"github.com/jchurchman/xwa-squad-builder/backend/internal/store"
)

// sources are the points sources a request may name (docs/architecture.md, D4).
var sources = map[string]bool{"amg": true, "xwa": true}

// VersionReader is the part of the store the service needs.
type VersionReader interface {
	LatestPublishedPointsVersion(ctx context.Context, source string) (*store.PointsVersion, error)
}

// Service implements pointsv1connect.PointsServiceHandler.
type Service struct {
	versions VersionReader
}

// New returns a Service backed by versions.
func New(versions VersionReader) *Service {
	return &Service{versions: versions}
}

// GetPointsVersion returns a source's newest published points version.
func (s *Service) GetPointsVersion(ctx context.Context, req *pointsv1.GetPointsVersionRequest) (*pointsv1.GetPointsVersionResponse, error) {
	source := req.GetSource()
	if !sources[source] {
		return nil, connect.NewError(connect.CodeInvalidArgument, `source must be "amg" or "xwa"`)
	}

	version, err := s.versions.LatestPublishedPointsVersion(ctx, source)
	if errors.Is(err, store.ErrNoPointsVersion) {
		return nil, connect.NewError(connect.CodeNotFound, "no published points version for "+source)
	}
	if err != nil {
		log.Printf("reading points version for %q: %v", source, err)
		return nil, connect.NewError(connect.CodeInternal, "could not read points version")
	}
	return &pointsv1.GetPointsVersionResponse{Version: pointsVersionToProto(version)}, nil
}

func pointsVersionToProto(v *store.PointsVersion) *pointsv1.PointsVersion {
	out := &pointsv1.PointsVersion{
		Source:        v.Source,
		Label:         v.Label,
		EffectiveDate: v.EffectiveDate,
		MaxListPoints: int32(v.MaxListPoints),
		PilotCosts:    make([]*pointsv1.PilotCost, 0, len(v.Pilots)),
		UpgradeCosts:  make([]*pointsv1.UpgradeCost, 0, len(v.Upgrades)),
	}
	for _, p := range v.Pilots {
		out.PilotCosts = append(out.PilotCosts, &pointsv1.PilotCost{
			PilotXws: p.PilotXWS,
			Cost:     int32(p.Cost),
			Loadout:  int32(p.Loadout),
			Slots:    p.Slots,
			Formats:  p.Formats,
		})
	}
	for _, u := range v.Upgrades {
		out.UpgradeCosts = append(out.UpgradeCosts, upgradeCostToProto(u))
	}
	return out
}

func upgradeCostToProto(u carddata.UpgradeCost) *pointsv1.UpgradeCost {
	out := &pointsv1.UpgradeCost{UpgradeXws: u.UpgradeXWS, FactionXws: u.FactionXWS, Formats: u.Formats}
	if u.Cost != nil {
		cost := int32(*u.Cost)
		out.Cost = &cost
	}
	return out
}
