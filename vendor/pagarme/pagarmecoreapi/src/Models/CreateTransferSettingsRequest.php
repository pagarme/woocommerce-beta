<?php
/*
 * PagarmeCoreApiLib
 *
 * This file was automatically generated by APIMATIC v2.0 ( https://apimatic.io ).
 */

namespace PagarmeCoreApiLib\Models;

use JsonSerializable;

/**
 *Informações de transferência do recebedor
 */
class CreateTransferSettingsRequest implements JsonSerializable
{
    /**
     * @todo Write general description for this property
     * @required
     * @maps transfer_enabled
     * @var bool $transferEnabled public property
     */
    public $transferEnabled;

    /**
     * @todo Write general description for this property
     * @required
     * @maps transfer_interval
     * @var string $transferInterval public property
     */
    public $transferInterval;

    /**
     * @todo Write general description for this property
     * @required
     * @maps transfer_day
     * @var integer $transferDay public property
     */
    public $transferDay;

    /**
     * Constructor to set initial or default values of member properties
     * @param bool    $transferEnabled  Initialization value for $this->transferEnabled
     * @param string  $transferInterval Initialization value for $this->transferInterval
     * @param integer $transferDay      Initialization value for $this->transferDay
     */
    public function __construct()
    {
        if (3 == func_num_args()) {
            $this->transferEnabled  = func_get_arg(0);
            $this->transferInterval = func_get_arg(1);
            $this->transferDay      = func_get_arg(2);
        }
    }


    /**
     * Encode this object to JSON
     */
    public function jsonSerialize()
    {
        $json = array();
        $json['transfer_enabled']  = $this->transferEnabled;
        $json['transfer_interval'] = $this->transferInterval;
        $json['transfer_day']      = $this->transferDay;

        return $json;
    }
}
