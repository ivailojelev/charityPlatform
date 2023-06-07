task("deploy", "Deploys the CharityPlatform contract")
  .setAction(async (taskArgs, hre) => {
    const [deployer] = await hre.ethers.getSigners();
    const CharityPlatform = await hre.ethers.getContractFactory("CharityPlatform", deployer);
    const charityPlatform = await CharityPlatform.deploy();
    await charityPlatform.deployed();
    console.log(`CharityPlatform with owner ${deployer.address} successfully deployed!`, charityPlatform.address);
  });

task("createCampaign", "Creates a campaign on the CharityPlatform contract")
  .addParam("campaign", "The address of the CharityPlatform contract to interact with")
  .addParam('description', 'The description of the campaign')
  .addParam('name', 'The name of the campaign')
  .addParam('fundingGoal', 'The funding goal of the campaign')
  .addParam('deadline', 'The deadline of the campaign')
  .setAction(async (taskArgs, hre) => {
    const [deployer] = await hre.ethers.getSigners();
    const CharityPlatform = await hre.ethers.getContractFactory("CharityPlatform", deployer);
    const charityPlatform = new hre.ethers.Contract(taskArgs.campaign, CharityPlatform.interface, deployer);
    const tx = await charityPlatform.createCampaign(taskArgs.name, taskArgs.description, taskArgs.fundingGoal, taskArgs.deadline);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
        console.log("Campaign successfully created!");
    } else if (receipt.status === 0) {
        console.log("Campaign creation failed!");
    }

    console.log('Campaing created', receipt);
  });