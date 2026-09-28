// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EscrowPayment
 * @notice A simple multi-escrow payment contract for a financial DApp.
 *         A buyer deposits ETH for a seller. The seller marks the service/goods
 *         as delivered, and the buyer releases the locked funds.
 */
contract EscrowPayment {
    enum Status {
        None,
        Funded,
        Delivered,
        Released,
        Refunded
    }

    struct Escrow {
        address payable buyer;
        address payable seller;
        uint256 amount;
        Status status;
        uint256 createdAt;
    }

    uint256 public nextEscrowId = 1;
    mapping(uint256 => Escrow) private escrows;

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );
    event DeliveryConfirmed(uint256 indexed escrowId, address indexed seller);
    event FundsReleased(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );
    event Refunded(
        uint256 indexed escrowId,
        address indexed seller,
        address indexed buyer,
        uint256 amount
    );

    modifier escrowExists(uint256 escrowId) {
        require(escrows[escrowId].status != Status.None, "Escrow does not exist");
        _;
    }

    modifier onlyBuyer(uint256 escrowId) {
        require(msg.sender == escrows[escrowId].buyer, "Only buyer can call");
        _;
    }

    modifier onlySeller(uint256 escrowId) {
        require(msg.sender == escrows[escrowId].seller, "Only seller can call");
        _;
    }

    /**
     * @notice Create and fund a new escrow.
     * @param seller Address of the seller.
     */
    function createEscrow(address payable seller)
        external
        payable
        returns (uint256 escrowId)
    {
        require(seller != address(0), "Seller cannot be zero address");
        require(seller != msg.sender, "Buyer and seller must differ");
        require(msg.value > 0, "Amount must be greater than zero");

        escrowId = nextEscrowId++;
        escrows[escrowId] = Escrow({
            buyer: payable(msg.sender),
            seller: seller,
            amount: msg.value,
            status: Status.Funded,
            createdAt: block.timestamp
        });

        emit EscrowCreated(escrowId, msg.sender, seller, msg.value);
    }

    /**
     * @notice Seller confirms that the goods/service has been delivered.
     */
    function markDelivered(uint256 escrowId)
        external
        escrowExists(escrowId)
        onlySeller(escrowId)
    {
        Escrow storage e = escrows[escrowId];
        require(e.status == Status.Funded, "Escrow is not funded");

        e.status = Status.Delivered;
        emit DeliveryConfirmed(escrowId, msg.sender);
    }

    /**
     * @notice Buyer releases funds after delivery.
     *         State is changed before the external call (checks-effects-interactions).
     */
    function releaseFunds(uint256 escrowId)
        external
        escrowExists(escrowId)
        onlyBuyer(escrowId)
    {
        Escrow storage e = escrows[escrowId];
        require(e.status == Status.Delivered, "Delivery not confirmed");

        uint256 amount = e.amount;
        address payable seller = e.seller;

        e.status = Status.Released;

        (bool ok, ) = seller.call{value: amount}("");
        require(ok, "ETH transfer failed");

        emit FundsReleased(escrowId, msg.sender, seller, amount);
    }

    /**
     * @notice Seller may voluntarily refund the buyer before funds are released.
     */
    function refundBuyer(uint256 escrowId)
        external
        escrowExists(escrowId)
        onlySeller(escrowId)
    {
        Escrow storage e = escrows[escrowId];
        require(
            e.status == Status.Funded || e.status == Status.Delivered,
            "Escrow cannot be refunded"
        );

        uint256 amount = e.amount;
        address payable buyer = e.buyer;

        e.status = Status.Refunded;

        (bool ok, ) = buyer.call{value: amount}("");
        require(ok, "ETH refund failed");

        emit Refunded(escrowId, msg.sender, buyer, amount);
    }

    function getEscrow(uint256 escrowId)
        external
        view
        escrowExists(escrowId)
        returns (
            address buyer,
            address seller,
            uint256 amount,
            Status status,
            uint256 createdAt
        )
    {
        Escrow memory e = escrows[escrowId];
        return (e.buyer, e.seller, e.amount, e.status, e.createdAt);
    }
}
