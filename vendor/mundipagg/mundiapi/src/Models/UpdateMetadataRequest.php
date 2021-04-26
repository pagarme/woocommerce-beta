<?php
/*
 * MundiAPILib
 *
 * This file was automatically generated by APIMATIC v2.0 ( https://apimatic.io ).
 */

namespace MundiAPILib\Models;

use JsonSerializable;

/**
 *Request for updating an metadata
 */
class UpdateMetadataRequest implements JsonSerializable
{
    /**
     * Metadata
     * @required
     * @var array $metadata public property
     */
    public $metadata;

    /**
     * Constructor to set initial or default values of member properties
     * @param array $metadata Initialization value for $this->metadata
     */
    public function __construct()
    {
        if (1 == func_num_args()) {
            $this->metadata = func_get_arg(0);
        }
    }


    /**
     * Encode this object to JSON
     */
    public function jsonSerialize()
    {
        $json = array();
        $json['metadata'] = $this->metadata;

        return $json;
    }
}
