const { expect } = require('chai')
const { ethers } = require('hardhat')
const { time } = require('@nomicfoundation/hardhat-network-helpers')

describe('DutchAuction', function () {
  let owner, seller, buyer, auct

  async function getTimestamp(bn) {
    return (await ethers.provider.getBlock(bn)).timestamp
  }

  beforeEach(async () => {
    ;[owner, seller, buyer] = await ethers.getSigners()

    const DutchAuction = await ethers.getContractFactory('DutchAuction', owner)
    auct = await DutchAuction.deploy(ethers.utils.parseEther('2.0'), 1, 'Bike')
    await auct.deployed()
  })

  it('Should be reverted if low price', async () => {
    const DutchAuction = await ethers.getContractFactory('DutchAuction', owner)
    await expect(DutchAuction.deploy(1, 11, 'Side item')).to.be.revertedWith(
      'price too low!'
    )
  })

  it('Should be deployed as intended', async () => {
    expect(await auct.seller()).to.eq(owner.address)
    expect(await auct.item()).to.eq('Bike')
    expect(await auct.startingPrice()).to.eq(ethers.utils.parseEther('2.0'))
    expect(await auct.discountRate()).to.eq(1)
    await auct.nextBlock()
  })

  it('Should fail if too late', async () => {
    await time.increase(2000000)
    await expect(
      auct.connect(buyer).buy({ value: ethers.utils.parseEther('1.0') })
    ).to.be.revertedWith('too late!')
  })

  it('Should fail if price too low', async () => {
    await expect(
      auct
        .connect(buyer)
        .buy({ value: ethers.utils.parseEther('0.0000000000000001') })
    ).to.be.revertedWith('too low!')
  })

  it('Should fail if stopped', async () => {
    auct.connect(buyer).buy({ value: ethers.utils.parseEther('3.0') })
    await expect(
      auct.connect(buyer).buy({ value: ethers.utils.parseEther('3.0') })
    ).to.be.revertedWith('has already stopped!')
  })
})
