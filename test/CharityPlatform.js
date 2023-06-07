const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { network } = require("hardhat");

describe("CharityPlatform", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployCharityPlatformFixture() {
    // Contracts are deployed using the first signer/account by default
    const [deployer, firstUser] = await ethers.getSigners();

    const CharityPlatform = await ethers.getContractFactory("CharityPlatform");
    const platform = await CharityPlatform.deploy();
    const platformFirstUser = platform.connect(firstUser);
    const platformSecondUser = platform.connect(deployer);
    const campaign = await platformFirstUser.createCampaign("Test Campaign", "Test Campaign Description", 1000, 30);
    const oneDayCampaign = await platformFirstUser.createCampaign("Test Campaign 2", "Test Campaign Description 2", 1000, 1);
    await campaign.wait();
    await oneDayCampaign.wait();
    return { platform, deployer, platformFirstUser, platformSecondUser };
  }

  describe("donation", function () {
    it("should revert if the deadline is passed", async function () {
      const { platformFirstUser } = await loadFixture(deployCharityPlatformFixture);
      await network.provider.send("evm_increaseTime", [90000]);
      await expect(platformFirstUser.donate(1)).to.be.revertedWith("Campaign is over");
    });

    it("should revert if the donation is less than 1 wei", async function () {
      const { platformFirstUser } = await loadFixture(deployCharityPlatformFixture);
      await expect(platformFirstUser.donate(0, {value: ethers.utils.parseEther("0.0")})).to.be.revertedWith("Donation must be greater than 0");
    });

    it("should revert if the donation is more than the funding goal", async function () {
      const { platformFirstUser } = await loadFixture(deployCharityPlatformFixture);
      await expect(platformFirstUser.donate(0, {value: ethers.utils.parseEther("1001")})).to.be.revertedWith("Donation must be less than funding goal");
    });

    it("should revert if the donation is more than the funding goal second check", async function () {
      const { platformFirstUser } = await loadFixture(deployCharityPlatformFixture);
      await platformFirstUser.donate(0, {value: ethers.utils.formatUnits(900, "wei")});
      await expect(platformFirstUser.donate(0, {value: ethers.utils.parseEther("1")})).to.be.revertedWith("Donation must be less than funding goal");
    });
  });

  describe("fundsRelease", function () {
    it("should revert if the campaign is not over", async function () {
      const { platformFirstUser } = await loadFixture(deployCharityPlatformFixture);
      await expect(platformFirstUser.collectFunds(0)).to.be.revertedWith("Campaign is not over");
    });

    it("should revert if the campaign is not funded", async function () {
      const { platformFirstUser } = await loadFixture(deployCharityPlatformFixture);
      await network.provider.send("evm_increaseTime", [90000]);
      await expect(platformFirstUser.collectFunds(1)).to.be.revertedWith("Campaign is not over");
    });

    it("should revert if it's not the owner", async function () {
      const { platformSecondUser } = await loadFixture(deployCharityPlatformFixture);
      await network.provider.send("evm_increaseTime", [90000]);
      await expect(platformSecondUser.collectFunds(0)).to.be.revertedWith("You are not the owner of this campaign");
    });
  });
});
