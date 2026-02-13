#!/bin/bash

# Dev Team Template Initialization Script
# Lightweight version - just the dev team, no executives

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║      Dev Team Initialization v1.0          ║"
echo "║   Lightweight Autonomous Feature Delivery  ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

# Get project directory
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: ./init-dev-team.sh <project-directory>${NC}"
    echo "Example: ./init-dev-team.sh ~/projects/my-cms"
    echo "         ./init-dev-team.sh .  # Current directory"
    exit 1
fi

PROJECT_DIR="$1"
TEMPLATE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Resolve . to actual path
if [ "$PROJECT_DIR" = "." ]; then
    PROJECT_DIR="$(pwd)"
fi

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}Directory $PROJECT_DIR does not exist.${NC}"
    read -p "Create it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mkdir -p "$PROJECT_DIR"
    else
        echo "Aborted."
        exit 1
    fi
fi

# Check if .claude directory already exists
if [ -d "$PROJECT_DIR/.claude" ]; then
    echo -e "${YELLOW}Warning: $PROJECT_DIR/.claude already exists.${NC}"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
    rm -rf "$PROJECT_DIR/.claude"
fi

echo -e "${GREEN}Initializing Dev Team in $PROJECT_DIR...${NC}"
echo

# Copy .claude directory (agents + commands)
echo "📦 Installing development team..."
cp -r "$TEMPLATE_DIR/.claude" "$PROJECT_DIR/"

# Copy shared memory (coding preferences only)
echo "🧠 Initializing coding preferences..."
if [ ! -d "$PROJECT_DIR/shared-memory" ]; then
    mkdir -p "$PROJECT_DIR/shared-memory"
fi
cp "$TEMPLATE_DIR/shared-memory/ceo-preferences.md" "$PROJECT_DIR/shared-memory/"

# Initialize git if not already initialized
if [ ! -d "$PROJECT_DIR/.git" ]; then
    echo "🔧 Initializing git repository..."
    cd "$PROJECT_DIR"
    git init
fi

# Add .gitignore entries
if [ ! -f "$PROJECT_DIR/.gitignore" ]; then
    touch "$PROJECT_DIR/.gitignore"
fi

# Check if Dev Team entries already exist
if ! grep -q "# Dev Team" "$PROJECT_DIR/.gitignore" 2>/dev/null; then
    echo "" >> "$PROJECT_DIR/.gitignore"
    echo "# Dev Team - Optional: exclude coding preferences" >> "$PROJECT_DIR/.gitignore"
    echo "# Uncomment to keep learnings private:" >> "$PROJECT_DIR/.gitignore"
    echo "# shared-memory/ceo-preferences.md" >> "$PROJECT_DIR/.gitignore"
fi

echo
echo -e "${GREEN}✓ Dev Team initialized successfully!${NC}"
echo
echo -e "${BLUE}What was installed:${NC}"
echo "  ✓ 8 Specialized agents (.claude/agents/)"
echo "    - 4 Researchers (best practices, codebase, docs, git history)"
echo "    - 4 Reviewers (style, security, performance, UX/accessibility)"
echo "  ✓ /ship-feature workflow"
echo "  ✓ Fidelity 1/2/3 routing (auto-detects complexity)"
echo "  ✓ Coding preferences learning system"
echo
echo -e "${BLUE}What was NOT installed (lightweight version):${NC}"
echo "  ✗ Executive team (Product/Growth/Finance)"
echo "  ✗ Business strategy files"
echo "  ✗ Daily standups / check-ins"
echo
echo -e "${BLUE}Next steps:${NC}"
echo "  1. cd $PROJECT_DIR"
echo "  2. Open in VSCode (or Claude Code)"
echo "  3. Start building: /ship-feature \"your feature\""
echo
echo -e "${BLUE}How it works:${NC}"
echo "  /ship-feature \"Add authentication\""
echo "  → Research (4 agents in parallel)"
echo "  → Present plan"
echo "  → Implement"
echo "  → Review (3 agents in parallel)"
echo "  → Ship"
echo
echo -e "${YELLOW}Pro tip:${NC} The team learns your coding style over time."
echo "After 20 features, it will write code that matches your"
echo "preferences without you having to explain every time."
echo
echo -e "${BLUE}Need the full CEO Console?${NC}"
echo "Use ~/code/ceo-console-template/ for projects that need"
echo "business strategy, growth planning, and financial tracking."
echo
