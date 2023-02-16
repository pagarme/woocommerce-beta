<?php
/**
 * @author      Open Source Team
 * @copyright   2022 Pagar.me (https://pagar.me)
 * @license     https://pagar.me Copyright
 *
 * @link        https://pagar.me
 */

declare( strict_types=1 );

namespace Woocommerce\Pagarme\Model\Payment\Data;

use Woocommerce\Pagarme\Model\Data\DataObject;
use Woocommerce\Pagarme\Model\Serialize\Serializer\Json;

defined( 'ABSPATH' ) || exit;

/**
 * Class Card
 * @package Woocommerce\Pagarme\Model\Payment\Data
 */
class Card extends AbstractPayment
{
    /** @var int */
    private $num;

    /** @var Multicustomers|null */
    private $multicustomers;

    /**
     * @param int $num
     * @param Json|null $jsonSerialize
     * @param array $data
     * @param Multicustomers|null $multicustomers
     */
    public function __construct(
        $num = 1,
        Json  $jsonSerialize = null,
        array $data = [],
        Multicustomers $multicustomers = null
    ) {
        parent::__construct($jsonSerialize, $data);
        $this->num = $num;
        if (!$multicustomers) {
            $multicustomers = new Multicustomers;
        }
        $this->multicustomers = $multicustomers;
        $this->init();
    }

    /**
     * @return void
     */
    private function init()
    {
        foreach ($this->getPostPaymentContent()['cards'][$this->num] as $field => $value) {
            $this->{$this->getMethod($field)}($value);
        }
    }

    /**
     * @param $data
     * @return $this
     */
    public function setMulticustomers($data)
    {
        return $this->setData('multicustomers', $this->multicustomers->setData($data));
    }
}
