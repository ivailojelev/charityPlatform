// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import './CharityNFT.sol';

contract CharityPlatform is CharityNFT {
    uint256 public campaignId = 0;
    bool internal locked;

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Donation) public donations;

    struct Campaign {
        string name;
        string description;
        uint256 fundingGoal;
        uint256 deadline;
        uint256 totalDonations;
        address campaignCreator;
        bool campaignEnded;
    }

    struct Donation {
        uint256 campaignId;
        uint256 amount;
        address donor;
    }

    /**
     * @notice Prevents re-entrancy attacks .
     * @dev     .
     */
    modifier _noReentrant() {
        require(!locked, "No re-entrancy");
        locked = true;
        _;
        locked = false;
    }

    modifier _onlyActiveCampaign(uint256 _campaignId) {
        require(
            block.timestamp < campaigns[_campaignId].deadline,
            "Campaign is over"
        );
        _;
    }

    /**
     * @notice Create a campaign .
     * @dev     .
     * @param   _name The name of the campaign .
     * @param   _description Campaign description .
     * @param   _fundingGoal Campaign funding goal .
     * @param   _deadlineInDays Campaign deadline .
     */
    function createCampaign(
        string memory _name,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _deadlineInDays
    ) public {
        require(_deadlineInDays > 0, "Deadline must be greater than 0");
        require(_deadlineInDays <= 365, "Deadline must be less than 365 days");
        require(_fundingGoal > 0, "Funding goal must be greater than 0");
        uint256 deadlineTimestamp = block.timestamp +
            _deadlineInDays *
            24 *
            60 *
            60;

        campaigns[campaignId] = Campaign(
            _name,
            _description,
            _fundingGoal,
            deadlineTimestamp,
            0,
            msg.sender,
            false
        );
        campaignId++;
    }

    /**
     * @notice Donate to a specific campaign .
     * @dev     .
     * @param   _campaignId Campaign id .
     */
    function donate(uint256 _campaignId) public payable _onlyActiveCampaign(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.value > 0, "Donation must be greater than 0");
        require(msg.value <= campaign.fundingGoal, "Donation must be less than funding goal");
        require(campaign.fundingGoal >= msg.value + campaign.totalDonations, "Donation must be less than remaining funding goal");
        campaign.totalDonations += msg.value;
        donations[_campaignId] = Donation(_campaignId, msg.value, msg.sender);
        safeMint(msg.sender, 'some uri');
        if (campaign.totalDonations == campaign.fundingGoal) {
            campaign.campaignEnded = true;
        }
    }

    /**
     * @notice The owner of the campaign can collect the donated funds .
     * @dev     .
     * @param   _campaignId Campaign id .
     */
    function collectFunds(uint256 _campaignId) public _noReentrant () {
        Campaign storage campaign = campaigns[_campaignId];
        bool isCampaignEnded = campaign.campaignEnded || (block.timestamp >= campaign.deadline && campaign.campaignEnded);
        require(campaign.campaignCreator == msg.sender, "You are not the owner of this campaign");
        require(isCampaignEnded, "Campaign is not over");
        (bool success, ) = payable(msg.sender).call{value: campaign.totalDonations}("");
        campaign.totalDonations = 0;

        require(success, "Failed to send Ether");
    }

    /**
     * @notice Refunds the donations to the users if the campaign is past due or hasn't been funded .
     * @dev     .
     * @param   _campaignId Campaign id .
     */
    function refund(uint256 _campaignId) public _noReentrant() {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp >= campaign.deadline, "Campaign is not over");
        require(campaign.totalDonations < campaign.fundingGoal, "Campaign is funded");
        (bool success, ) = payable(msg.sender).call{value: donations[_campaignId].amount}("");
        campaign.totalDonations -= donations[_campaignId].amount;

        require(success, "Failed to send Ether");
    }
}
