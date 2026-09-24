<?php

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php';

global $USER;
if (!is_object($USER) || !$USER->IsAuthorized()) {
	LocalRedirect('/auth/?backurl=' . urlencode('/shop-tc/'));
}

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php';
require_once __DIR__ . '/lib/Roles.php';

use Bitrix\Main\UI\Extension;

global $USER, $APPLICATION;

$APPLICATION->SetTitle('Deal Scouting');
Extension::load(['ui.forms', 'ui.buttons', 'ui.alerts', 'ui.fonts.opensans']);

$me = DealScoutRoles::current();
$agentName = trim((string)($me['name'] !== '' ? $me['name'] : ($USER->GetFullName() ?: $USER->GetLogin())));
$agentEmail = (string)$USER->GetEmail();
$editId = htmlspecialchars((string)($_GET['id'] ?? ''), ENT_QUOTES);
$roles = (array)($me['roles'] ?? []);
$isCompliance = in_array(DealScoutRoles::COMPLIANCE, $roles, true);
$isMalik = in_array(DealScoutRoles::MALIK, $roles, true);
$isAgent = in_array(DealScoutRoles::AGENT, $roles, true);
$roleLine = $me['roleLabels'] !== [] ? implode(' · ', $me['roleLabels']) : 'View only';

$checkGroups = [
	'checks-system' => [
		'label' => 'System checks — Compliance Officer looks in Bitrix24. Never the agent’s word.',
		'items' => [
			1 => 'Deal in Bitrix24 with full stage history (not created after the fact).',
			2 => 'All agents sharing this deal are named in Bitrix24, matching Agent Split Details on page 1.',
		],
	],
	'checks-comms' => [
		'label' => 'Communication checks — IT or Compliance, pulled from 3CX / company WhatsApp. Not the agent.',
		'items' => [
			3 => 'All client calls on company 3CX number (checked vs. call log).',
			4 => 'All client WhatsApp on company number (checked vs. Bitrix24 chat).',
			5 => 'No client contact via agent\'s personal / unknown number.',
		],
	],
	'checks-docs' => [
		'label' => 'Documentation checks — Compliance confirms the files exist. Agent may attach the copies they collected.',
		'items' => [
			6 => 'Commission agreed evidenced by recorded call/WhatsApp, attached.',
			7 => 'Commission matches rate card, or written pre-approval attached.',
			8 => 'Signed Form A / Form F / MOU on file, as applicable.',
			9 => 'Title deed (resale) or tenancy contract + Ejari (rental) on file.',
			10 => 'Client Emirates ID and passport copy on file.',
			11 => 'Owner details and owner\'s written approval on file.',
		],
	],
	'checks-money' => [
		'label' => 'Money checks — Accounts / Finance only. Check 13 is bank confirmation. No exceptions.',
		'items' => [
			12 => 'Tax invoice correct: TRN, sequential no., net + VAT shown separately.',
			13 => 'Commission actually RECEIVED into company bank account.',
			14 => 'Cheques logged in Cheque Register (no., bank, date, amount, payee).',
		],
	],
];

function sc_choice(string $name, string $label, array $options, array $extra = []): void
{
	$h = static function ($s) {
		return htmlspecialchars((string)$s, ENT_QUOTES);
	};
	$when = (string)($extra['when'] ?? '');
	$class = 'sc-choice' . (!empty($extra['wide']) ? ' sc-wide' : '');

	echo '<div class="' . $class . '" data-choice="' . $h($name) . '"'
		. ($when !== '' ? ' data-when="' . $h($when) . '"' : '')
		. '>';
	echo '<span class="sc-choice-label">' . $h($label) . '</span>';
	echo '<input type="hidden" name="' . $h($name) . '"'
		. (!empty($extra['source']) ? ' data-when-source' : '')
		. '>';
	echo '<div class="sc-choice-btns">';
	foreach ($options as $value => $text) {
		$val = is_int($value) ? $text : $value;
		echo '<button type="button" data-choice-val="' . $h($val) . '">' . $h($text) . '</button>';
	}
	echo '</div></div>';
}

function sc_who(array $me, string $section): void
{
	$sec = $me['sections'][$section] ?? null;
	if (!is_array($sec)) {
		return;
	}
	$can = !empty($sec['can']);
	echo '<p class="sc-who' . ($can ? ' is-you' : '') . '">'
		. htmlspecialchars((string)$sec['whoLabel'])
		. ($can ? ' — you can edit this' : ' — locked for your role')
		. '</p>';
}
?>
<link rel="stylesheet" href="/shop-tc/assets/app.css?v=9">

<div class="sc-wrap">
	<div class="sc-hero">
		<h1>Deal Scouting &amp; Compliance Check</h1>
		<p>The person who fills the deal never checks it. The person who checks it never confirms the money. Malik is a fourth, independent sign-off. At least three different people must touch a file before payout.</p>
		<div class="sc-agent">Signed in: <strong><?= htmlspecialchars($agentName) ?></strong><?= $agentEmail !== '' ? ' · ' . htmlspecialchars($agentEmail) : '' ?></div>
		<div class="sc-role-line">Your permission: <strong><?= htmlspecialchars($roleLine) ?></strong></div>
		<div class="sc-hero-actions">
			<a class="ui-btn ui-btn-light" href="/sign/">Back to Sign</a>
			<?php if (!empty($me['canCreate'])): ?>
				<button type="button" class="ui-btn" id="sc-new">New deal file</button>
			<?php else: ?>
				<button type="button" class="ui-btn" id="sc-new" hidden>New deal file</button>
			<?php endif; ?>
		</div>
	</div>

	<div id="sc-status" class="sc-status" hidden></div>

	<div class="sc-layout">
		<form id="sc-form" class="sc-form" autocomplete="off">
			<input type="hidden" name="id" value="<?= $editId ?>">
			<input type="hidden" name="commissionLocked" value="">

			<section data-section="deal">
				<h2>Deal information</h2>
				<?php sc_who($me, 'deal'); ?>
				<p class="sc-hint">Sales agent fills the deal they closed. Click Deal ID to pick from Bitrix.</p>
				<div class="sc-grid sc-grid-3">
					<label class="sc-pick">Deal ID <span class="sc-req">required</span> <input name="dealId" data-crm="deal" placeholder="Click to pick a Bitrix deal" autocomplete="off"></label>
					<?php sc_choice('dealType', 'Deal type', ['Rental' => 'Rental', 'Resale' => 'Resale', 'Off-plan' => 'Off-plan'], ['wide' => true, 'source' => true]); ?>
					<label>Date closed <input name="dateClosed" type="date"></label>
					<label>Deal value (AED) <input name="dealValue" placeholder="0.00"></label>
					<label>File / property ref no. <input name="fileRef"></label>
					<label>Deal source <input name="dealSource" placeholder="Portal / referral / walk-in"></label>
					<label>No. of agents on deal <input name="agentCount" type="number" min="1" max="20" value="1" readonly></label>
				</div>
			</section>

			<section data-section="review">
				<h2>Reviewed by <span class="sc-tag">Compliance</span></h2>
				<?php sc_who($me, 'review'); ?>
				<p class="sc-hint">Must be someone other than the agent, or “review” means nothing.</p>
				<div class="sc-grid sc-grid-3">
					<label class="sc-pick">Reviewed by <input name="reviewedBy" data-crm="user" value="<?= $isCompliance ? htmlspecialchars($agentName) : '' ?>" autocomplete="off"></label>
					<label>Review date <input name="reviewDate" type="date" value="<?= $isCompliance ? htmlspecialchars(date('Y-m-d')) : '' ?>"></label>
				</div>
			</section>

			<section data-section="client">
				<h2>Client identification <span class="sc-tag">Check 10, 5</span></h2>
				<?php sc_who($me, 'client'); ?>
				<p class="sc-hint">Agent met the client and collected the IDs. Pick <b>Individual</b> or <b>Company</b>.</p>
				<div class="sc-grid">
					<?php sc_choice('clientType', 'Client type', ['individual' => 'Individual', 'company' => 'Company'], ['wide' => true, 'source' => true]); ?>
					<p class="sc-type-hint sc-wide" data-when="clientType:" data-when-empty>Choose Individual or Company to open the matching fields.</p>
					<label class="sc-pick" data-when="clientType:individual">Client full legal name <input name="clientName" data-crm="party" placeholder="Click to pick a contact" autocomplete="off"></label>
					<label class="sc-pick" data-when="clientType:company">Company name <input name="companyName" data-crm="company" placeholder="Click to pick a company" autocomplete="off"></label>
					<label data-when="clientType:individual">Emirates ID number <input name="eidNumber"></label>
					<label data-when="clientType:individual">EID expiry date <input name="eidExpiry" type="date"></label>
					<label data-when="clientType:individual">Nationality <input name="nationality"></label>
					<label data-when="clientType:individual">Passport number <input name="passportNumber"></label>
					<label data-when="clientType:individual">Passport expiry date <input name="passportExpiry" type="date"></label>
					<label data-when="clientType:individual">Passport issued by (country) <input name="passportIssuedBy"></label>
					<label data-when="clientType:company">Trade licence no. <input name="tradeLicence"></label>
					<label data-when="clientType:company">Authorised signatory <input name="signatoryName"></label>
					<label data-when="clientType:company">Signatory EID no. <input name="signatoryEid"></label>
					<label data-when="clientType:individual,company">Mobile (company-verified) <input name="clientMobile"></label>
					<label data-when="clientType:individual,company">Email <input name="clientEmail" type="email"></label>
					<?php sc_choice('idCopies', 'ID copies attached', ['yes' => 'Yes', 'no' => 'No'], ['when' => 'clientType:individual,company']); ?>
				</div>
			</section>

			<section data-section="idverify">
				<h2>ID verified by <span class="sc-tag">Compliance</span></h2>
				<?php sc_who($me, 'idverify'); ?>
				<p class="sc-hint">Second set of eyes: the copy matches what was typed. Catches mistakes and invented clients.</p>
				<div class="sc-grid">
					<label>ID verified by / date <input name="idVerifiedBy" placeholder="Name + date"></label>
				</div>
			</section>

			<section data-section="property">
				<h2>Property details <span class="sc-tag">Check 9</span></h2>
				<?php sc_who($me, 'property'); ?>
				<p class="sc-hint">Agent fills from the listing. Title deed / Ejari is then confirmed by Compliance or Ops — not only the agent’s copy.</p>
				<div class="sc-grid">
					<label class="sc-wide sc-pick">Search property / unit from Bitrix
						<input type="search" name="propertySearch" data-crm="unit" placeholder="Click to scroll the property list, or type unit / building" autocomplete="off">
					</label>
					<?php sc_choice('propertyType', 'Property type', ['Apartment' => 'Apartment', 'Villa' => 'Villa', 'Shop' => 'Shop', 'Land' => 'Land', 'Other' => 'Other'], ['wide' => true, 'source' => true]); ?>
					<label class="sc-pick">Community / development <input name="community" data-crm="unit" autocomplete="off"></label>
					<label class="sc-pick">Building / tower <input name="building" data-crm="unit" autocomplete="off"></label>
					<label class="sc-pick" data-when="propertyType:Apartment,Villa,Shop,Other,">Unit number <input name="unitNo" data-crm="unit" autocomplete="off"></label>
					<label data-when="propertyType:Villa,Land,Other,">Plot number (villas/land) <input name="plotNo"></label>
					<label>Size (sq ft) <input name="sizeSqft"></label>
					<label data-when="propertyType:Apartment,Villa,Other,">Bedrooms / bathrooms <input name="bedsBaths" placeholder="2 / 2"></label>
					<label data-when="dealType:Resale">Title deed no. (resale) <input name="titleDeed"></label>
					<label data-when="dealType:Off-plan">SPA / Oqood no. (off-plan) <input name="spaNo"></label>
					<label data-when="dealType:Rental">Tenancy contract / Ejari no. <input name="ejariNo"></label>
					<label data-when="dealType:Rental,Resale,">DEWA premise number <input name="dewaNo"></label>
					<label class="sc-pick">Owner name <input name="ownerName" data-crm="party" placeholder="Click to pick owner from CRM" autocomplete="off"></label>
					<label>Owner contact number <input name="ownerPhone"></label>
					<label>Management reference no. <input name="mgmtRef"></label>
					<label>Owner instruction (deposit/hand/direct) <input name="ownerInstruction"></label>
					<label class="sc-wide">Notes <input name="notes"></label>
				</div>
			</section>

			<section data-section="commission">
				<h2>Total commission — split</h2>
				<?php sc_who($me, 'commission'); ?>
				<p class="sc-hint">Agent proposes the figures. Accounts locks them against the rate card. VAT, gross, and AED shares calculate themselves.</p>
				<div class="sc-grid">
					<label>Total commission earned (AED) <input name="totalCommission" data-money="total" inputmode="decimal"></label>
					<label>VAT % applied <input name="vatPercent" value="5" data-money="vat" inputmode="decimal"></label>
					<label>VAT amount (AED) <input name="vatAmount" readonly></label>
					<label>Gross commission, incl. VAT (AED) <input name="grossCommission" readonly></label>
					<label>Company share (%) <input name="companySharePct" data-money="companyPct" inputmode="decimal"></label>
					<label>Company share (AED) <input name="companyShareAed" readonly></label>
					<label>Agent share (%) — total <input name="agentSharePct" data-money="agentPct" inputmode="decimal"></label>
					<label>Agent share (AED) — total <input name="agentShareAed" readonly></label>
				</div>
				<p class="sc-split-status" id="sc-split-status">VAT, gross, and AED shares calculate as you type. Company % + agent % must equal 100.</p>
				<?php if (!empty($me['canLockCommission'])): ?>
					<button type="button" class="ui-btn" id="sc-lock-commission">Lock final figures</button>
				<?php endif; ?>
			</section>

			<section data-section="split">
				<h2>Agent split details</h2>
				<?php sc_who($me, 'split'); ?>
				<p class="sc-hint">Sales manager or team leader only — never the agent alone. Stops a fake “co-agent” being named to split money.</p>
				<div id="sc-agents">
					<div class="sc-agent-row" data-agent="1">
						<div class="sc-agent-head">
							<span class="sc-agent-num">Agent 1</span>
						</div>
						<div class="sc-agent-grid">
							<label class="sc-pick">Agent name <input name="agent1Name" data-crm="user" value="<?= $isAgent ? htmlspecialchars($agentName) : '' ?>" placeholder="Click to pick a Bitrix user" autocomplete="off"></label>
							<label>Employee ID <input name="agent1EmpId"></label>
							<?php sc_choice('agent1Office', 'Office', ['Dubai' => 'Dubai', 'Pakistan' => 'Pakistan']); ?>
							<?php sc_choice('agent1Role', 'Role', ['Sourcing' => 'Sourcing', 'Closing' => 'Closing', 'Listing' => 'Listing', 'Referral' => 'Referral'], ['wide' => true]); ?>
							<label>Contact no. (company) <input name="agent1Contact"></label>
							<label>Split % <input name="agent1Split" data-money="agentSplit" inputmode="decimal"></label>
							<label>Amount (AED) <input name="agent1Amount" data-money="agentAmount" inputmode="decimal"></label>
						</div>
					</div>
				</div>
				<div class="sc-agent-actions">
					<button type="button" class="ui-btn ui-btn-primary" id="sc-add-agent" <?= empty($me['canAddAgent']) ? 'hidden' : '' ?>>Add agent</button>
				</div>
			</section>

			<section>
				<h2>14-point compliance check <span class="sc-tag">JD Section 5</span></h2>
				<p class="sc-hint">Each group can only be ticked by the role that can actually verify it. One <b>F</b> puts the file on hold. Result fills itself.</p>
				<div class="sc-check-table">
					<div class="sc-check-head"># Check · P / F / N/A · Supporting document</div>
					<?php foreach ($checkGroups as $groupId => $group): ?>
						<div class="sc-check-group" data-section="<?= htmlspecialchars($groupId) ?>">
							<div class="sc-check-group-head"><?= htmlspecialchars($group['label']) ?></div>
							<?php foreach ($group['items'] as $n => $text): ?>
								<div class="sc-check-row" data-check="<?= $n ?>">
									<span class="sc-check-num"><?= $n ?></span>
									<span class="sc-check-text"><?= htmlspecialchars($text) ?></span>
									<div class="sc-pfn">
										<label><input type="radio" name="check<?= $n ?>" value="P"> P</label>
										<label><input type="radio" name="check<?= $n ?>" value="F"> F</label>
										<label><input type="radio" name="check<?= $n ?>" value="NA"> N/A</label>
									</div>
									<div class="sc-evidence">
										<label class="sc-file-btn">
											<span>Upload document</span>
											<input type="file" data-evidence="<?= $n ?>" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf,image/*">
										</label>
										<span class="sc-ev-type" data-ev-type="<?= $n ?>" hidden></span>
										<span class="sc-ev-name" data-ev-name="<?= $n ?>">No file yet</span>
										<input type="hidden" name="check<?= $n ?>Evidence">
										<input type="hidden" name="check<?= $n ?>FileId">
										<input type="hidden" name="check<?= $n ?>FileName">
									</div>
								</div>
							<?php endforeach; ?>
						</div>
					<?php endforeach; ?>
				</div>
				<div class="sc-grid sc-grid-3" style="margin-top:14px">
					<div class="sc-result sc-wide">
						<span class="sc-choice-label">Result — set by the 14 checks</span>
						<input type="hidden" name="result" data-when-source>
						<div id="sc-result-banner" class="sc-result-banner is-wait">In review — each role answers their checks. Result fills itself.</div>
					</div>
					<label data-when="result:fail">If on hold — check # and reason <input name="failReason" placeholder="e.g. Check 13 — funds not in company account"></label>
					<label>Passed / failed / N/A
						<div class="sc-counts">
							<input name="passedCount" readonly placeholder="P">
							<input name="failedCount" readonly placeholder="F">
							<input name="naCount" readonly placeholder="N/A">
						</div>
					</label>
				</div>
			</section>

			<section data-section="sign-reviewer">
				<h2>Reviewed by — sign-off</h2>
				<?php sc_who($me, 'sign-reviewer'); ?>
				<p class="sc-hint">The compliance officer who ran the 14-point check. Not the agent.</p>
				<div class="sc-grid sc-grid-3">
					<label class="sc-pick">Reviewed by <input name="reviewerName" data-crm="user" value="<?= $isCompliance ? htmlspecialchars($agentName) : '' ?>" autocomplete="off"></label>
					<label>Reviewer signature <input name="reviewerSign" placeholder="Type full name"></label>
				</div>
			</section>

			<section data-section="sign-malik">
				<h2>Countersign — Malik</h2>
				<?php sc_who($me, 'sign-malik'); ?>
				<p class="sc-hint">Second, senior, independent approval. So a careless or compromised checker still cannot release a payout.</p>
				<div class="sc-grid sc-grid-3">
					<label>Countersign (Malik) <input name="countersignName" value="<?= $isMalik ? htmlspecialchars($agentName) : '' ?>" placeholder="Malik"></label>
					<label>Malik signature <input name="countersignSign" placeholder="Type full name"></label>
				</div>
			</section>

			<div class="sc-actions">
				<button type="button" class="ui-btn ui-btn-primary" data-save>Save my section</button>
				<button type="button" class="ui-btn ui-btn-success" data-download>Save &amp; download PDF</button>
			</div>
		</form>

		<aside class="sc-board" aria-label="Deal scouting">
			<div class="sc-column">
				<div class="sc-column-head">
					<span class="sc-column-dot"></span>
					<strong>Deal scouting</strong>
					<span id="sc-count" class="sc-count">0</span>
				</div>
				<p class="sc-hint">Every saved file stays here with the date and time. Filter by month, result, or agent.</p>
				<div class="sc-filters">
					<div class="sc-choice">
						<span class="sc-choice-label">Saved</span>
						<div class="sc-choice-btns" id="sc-filter-period">
							<button type="button" data-filter-period="all" class="is-on">Any time</button>
							<button type="button" data-filter-period="this-month">This month</button>
							<button type="button" data-filter-period="last-month">Last month</button>
							<button type="button" data-filter-period="this-year">This year</button>
						</div>
					</div>
					<div class="sc-choice">
						<span class="sc-choice-label">Status</span>
						<div class="sc-choice-btns" id="sc-filter-result">
							<button type="button" data-filter-result="" class="is-on">All</button>
							<button type="button" data-filter-result="pass">PASS</button>
							<button type="button" data-filter-result="fail">On hold</button>
							<button type="button" data-filter-result="await">Awaiting</button>
						</div>
					</div>
					<label>Agent <input id="sc-filter-agent" type="search" placeholder="Show deals for agent…" autocomplete="off"></label>
				</div>
				<div id="sc-cards" class="sc-cards"></div>
			</div>
		</aside>
	</div>
</div>

<script>
window.SC_ME = <?= json_encode($me, JSON_UNESCAPED_UNICODE) ?>;
</script>
<script src="/shop-tc/assets/app.js?v=9"></script>
<?php
require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php';
