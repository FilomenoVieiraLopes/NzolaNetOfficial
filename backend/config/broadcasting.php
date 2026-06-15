<?php

return [
    // O projecto usa polling no frontend, por isso nao precisa de WebSockets.
    'default' => env('BROADCAST_CONNECTION', 'null'),

    'connections' => [
        'null' => [
            'driver' => 'null',
        ],
    ],
];
