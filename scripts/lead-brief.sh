#!/usr/bin/env bash
# Compact per-lead brief — pulls the live CRM state and prints just what's
# needed to draft or review one lead, instead of the whole ~470KB blob.
#
# Usage:
#   scripts/lead-brief.sh <id-or-name-fragment>
#   scripts/lead-brief.sh nielsen
#   scripts/lead-brief.sh 3c42t955
#
# Always pulls fresh — never trust a cached copy, the CRM changes constantly.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ARMANLEADS_ENV:-$SCRIPT_DIR/../../.env}"

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <lead-id-or-name-fragment>" >&2
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
my $query = lc($ARGV[1]);
open(my $fh, "<:raw", $ARGV[0]) or die $!;
local $/; my $raw = <$fh>; close($fh);
my $data = JSON::PP->new->decode($raw)->[0]{data};
my @matches = grep {
  lc($_->{id}//"") eq $query
  || index(lc($_->{name}//""), $query) >= 0
} @{$data->{leads}};

if (!@matches) { print "No lead matches \"$ARGV[1]\".\n"; exit 1; }
if (@matches > 1) {
  print scalar(@matches)." matches for \"$ARGV[1]\" — be more specific:\n";
  print "  $_->{id}  $_->{name}  ($_->{city})\n" for @matches;
  exit 0;
}

my $l = $matches[0];
my $stages_offset = { fu1 => 3, fu2 => 7, fu3 => 14 };

print "=" x 60 ."\n";
print "$l->{name}  [$l->{id}]\n";
print "$l->{city}  ·  $l->{status}  ·  angle: ".($l->{angleType}||"(none)")."\n";
print "owner: ".($l->{ownerName}||"?")."   email: ".($l->{email}||"NONE ON FILE")."   phone: ".($l->{phone}||"?")."\n";
print "website: ".($l->{website}||"?")."   rating: ".($l->{rating}||"?")." (".($l->{reviewCount}||"?")." reviews)\n";
print "assigned: $l->{assignedTo}   added: $l->{dateAdded}   last updated: $l->{lastUpdated} by $l->{lastUpdatedBy}\n";
if ($l->{status} eq "Disqualified") {
  print "\nDISQUALIFIED: ".($l->{disqualifyReason}||"(no reason on file)")."\n";
}
if ($l->{repliedDate}) {
  print "\n>>> REPLIED on $l->{repliedDate} — check the actual thread before drafting anything else. <<<\n";
}

print "\n--- SMYK Notes ---\n";
print(($l->{smykNotes} && length($l->{smykNotes}) ? $l->{smykNotes} : "(none)")."\n");

if ($l->{nextNote}) { print "\n--- Next action / note to partner ---\n$l->{nextNote}\n"; }

print "\n--- Draft/send status ---\n";
for my $stage (qw(initial fu1 fu2 fu3)) {
  my $subj = $l->{drafts}{$stage}{subject} // "";
  my $body = $l->{drafts}{$stage}{body} // "";
  my $sent = $l->{sentDates}{$stage} // "";
  my $has_link = $body =~ m{armanleads\.com/r/} ? "" : ($body ? "  [MISSING TRACKED LINK]" : "");
  my $wc = $body ? scalar(split(/\s+/, $body)) : 0;
  my $state = $sent ? "SENT $sent" : (length($subj) ? "drafted, not sent" : "not written");
  print "  $stage: $state";
  print "  \"$subj\"" if length($subj);
  print "  (${wc}w)$has_link" if $body;
  print "\n";
}

if ($l->{sentDates}{initial} && !$l->{repliedDate} && $l->{status} ne "Disqualified") {
  print "\n--- Follow-up schedule (from initial sent date) ---\n";
  for my $stage (qw(fu1 fu2 fu3)) {
    next if $l->{sentDates}{$stage};
    my $due = `date -d "$l->{sentDates}{initial} +$stages_offset->{$stage} days" +%Y-%m-%d 2>/dev/null`;
    chomp $due;
    print "  $stage due: ".($due || "+$stages_offset->{$stage}d from $l->{sentDates}{initial}")."\n" unless length($l->{drafts}{$stage}{subject}//"");
  }
}

if ($l->{activityLog} && @{$l->{activityLog}}) {
  print "\n--- Recent activity ---\n";
  my @log = @{$l->{activityLog}};
  my @recent = @log > 5 ? @log[-5..-1] : @log;
  print "  $_->{at}  $_->{by}: $_->{action}\n" for @recent;
}
print "=" x 60 ."\n";
' "$TMP" "$1"
