#!/usr/bin/env bash
# Shows the opening line of every drafted email at a given stage, across
# all leads, sent ones first (most recent first) - so whoever's about to
# write a new one (me or Arman) can see what's already been used and avoid
# repeating the same formula. Directly operationalizes the no-repeat-formula
# rule in the outreach methodology instead of relying on memory of a
# dozen-plus recent drafts.
#
# Usage: scripts/recent-openers.sh <stage>
#   scripts/recent-openers.sh fu1
#   scripts/recent-openers.sh initial

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ARMANLEADS_ENV:-$SCRIPT_DIR/../../.env}"
STAGE="${1:-}"

if [ -z "$STAGE" ]; then
  echo "Usage: $0 <initial|fu1|fu2|fu3>" >&2
  exit 1
fi

if [ -f "$ENV_FILE" ]; then
  set -a; source "$ENV_FILE"; set +a
fi
if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (checked $ENV_FILE, or set ARMANLEADS_ENV)." >&2
  exit 1
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
curl -s "${SUPABASE_URL}/rest/v1/armanleads_state?select=data" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -o "$TMP"

perl -MJSON::PP -e '
my $stage = $ARGV[1];
open(my $fh, "<:raw", $ARGV[0]) or die $!;
local $/; my $raw = <$fh>; close($fh);
my $data = JSON::PP->new->decode($raw)->[0]{data};

my (@sent, @unsent);
for my $l (@{$data->{leads}}) {
  my $body = $l->{drafts}{$stage}{body} // "";
  next unless length($body) > 5;
  my @words = split(/\s+/, $body);
  my $opener = join(" ", @words[0 .. (scalar(@words) > 9 ? 9 : $#words)]);
  my $sentDate = $l->{sentDates}{$stage} // "";
  my $row = { name => $l->{name} || "?", id => $l->{id}, opener => $opener, sentDate => $sentDate };
  if ($sentDate) { push @sent, $row; } else { push @unsent, $row; }
}

print "=== $stage openers - SENT (most recent first) ===\n";
if (!@sent) { print "  (none sent yet)\n"; }
for my $r (sort { $b->{sentDate} cmp $a->{sentDate} } @sent) {
  print "  [$r->{sentDate}] $r->{name}: \"$r->{opener}...\"\n";
}

print "\n=== $stage openers - DRAFTED, NOT YET SENT ===\n";
if (!@unsent) { print "  (none)\n"; }
for my $r (@unsent) {
  print "  $r->{name}: \"$r->{opener}...\"\n";
}
' "$TMP" "$STAGE"
