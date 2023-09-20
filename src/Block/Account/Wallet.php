<?php
/**
 * @author      Open Source Team
 * @copyright   2022 Pagar.me (https://pagar.me)
 * @license     https://pagar.me Copyright
 *
 * @link        https://pagar.me
 */


declare( strict_types=1 );

namespace Woocommerce\Pagarme\Block\Account;

use Woocommerce\Pagarme\Block\Template;
use Woocommerce\Pagarme\Model\Customer;
use Woocommerce\Pagarme\Model\Account;
use Woocommerce\Pagarme\Core;

defined( 'ABSPATH' ) || exit;

/**
 * Class Pix
 * @package Woocommerce\Pagarme\Block\Template
 */
class Wallet extends Template
{

    /**
     * @var string
     */
    protected $_template = 'templates/myaccount/wallet';

    /**
     * @var string[]
     */
    protected $scripts = ['my-account/wallet'];

    public $walletCards;

    public function __construct()
    {
        $this->walletCards = $this->getCards();
        parent::__construct();
        $this->addDataToJs();
    }

    public function getCards()
    {
        $customer = new Customer(get_current_user_id());
        return $customer->cards;
    }

    private function addDataToJs()
    {
        wp_localize_script(
            WCMP_JS_HANDLER_BASE_NAME . 'wallet',
            'apiRoute',
            $this->getApiRoute()
        );
        wp_localize_script(
            WCMP_JS_HANDLER_BASE_NAME . 'wallet',
            'dataSwal',
            $this->getSwalData()
        );
    }

    private function getApiRoute()
    {
        return get_home_url(null, '/wc-api/' . Account::WALLET_ENDPOINT);
    }

    private function getSwalData()
    {
        $swalData = [
            'title'          => __('Waiting...', 'woo-pagarme-payments'),
            'text'           => __('We are processing your request.', 'woo-pagarme-payments'),
            'confirm_title'  => __('Are you sure?', 'woo-pagarme-payments'),
            'confirm_text'   => __('You won\'t be able to revert this!', 'woo-pagarme-payments'),
            'confirm_button' => __('Yes, delete it!', 'woo-pagarme-payments'),
            'cancel_button'  => __('No, cancel!', 'woo-pagarme-payments'),
            'confirm_color'  => '#3085d6',
            'cancel_color'   => '#d33',
        ];
        return $swalData;
    }
}
