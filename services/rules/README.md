# DRC Rules Service

FastAPI service implementing comprehensive Design Rule Checks (DRC) for cable assemblies.

## Features

- **Complete DRC Engine**: Implements mechanical, electrical, standards, labeling, and consistency checks
- **Auto-fixes**: Provides automated fix suggestions for common issues
- **Pydantic Models**: Fully typed models aligned with OpenAPI contracts
- **Comprehensive Tests**: Full test coverage with pytest

## API Endpoints

- `GET /drc/rulesets` - Get available DRC rulesets
- `POST /drc/run` - Run DRC on an assembly
- `POST /drc/apply-fixes` - Apply DRC fixes to an assembly

## DRC Rule Categories

### Mechanical
- Connector positions/ways matching conductor count
- Bend radius verification for long cables
- Accessory clamp range validation

### Electrical
- AWG ampacity vs current requirements (with derating)
- Voltage/temperature rating compliance
- Shield termination policy consistency

### Standards
- IPC/WHMA class specification
- RoHS/REACH compliance
- UL94 labeling requirements

### Labeling
- Title block completeness
- Label text content validation
- Label offset positioning

### Consistency
- Ribbon cable red-stripe positioning
- Pin-1 triangle markings
- Locale-specific color semantics
- Ring lug stud size requirements

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run tests
pytest

# Start development server
make dev
```

## Docker

```bash
# Build
make build

# Run
make run
```