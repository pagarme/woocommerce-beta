<?php
/**
 * @author      Open Source Team
 * @copyright   2022 Pagar.me (https://pagar.me)
 * @license     https://pagar.me Copyright
 *
 * @link        https://pagar.me
 */

/** @var \Woocommerce\Pagarme\Block\Checkout\Gateway $this */

declare( strict_types=1 );

if (!function_exists('add_action')) {
    exit(0);
}

global $woocommerce;

wp_enqueue_script('pagarme-checkout-card', $this->getFileUrl('assets/javascripts/front/checkout/model/payment.js'));
wp_localize_script(
    'pagarme-checkout-card',
    'wc_pagarme_checkout',
    ['config' => $this->getConfigDataProvider()]
);

$wc_api = $this->getHomeUrl();
?>
<div id="wcmp-checkout-errors">
    <ul class="woocommerce-error"></ul>
</div>
<?= $this->createBlock('\Woocommerce\Pagarme\Block\Checkout\Environment', 'pagarme.checkout.environment')->toHtml()  ?>
<?= $this->createBlock($this->getPaymentClass(), 'pagarme.checkout.payment', ['payment_instance' => $this->getPaymentInstance()])->toHtml() ?>
<script type="application/javascript">
    var ajaxUrl = "<?= admin_url('admin-ajax.php'); ?>";
    var cartTotal = <?= WC()->cart->total ?>;
</script>
