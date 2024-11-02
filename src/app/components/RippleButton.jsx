"use client"

import React from 'react';
import Ripples from 'react-ripples';
import PropTypes from 'prop-types';

const RippleButton = ({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  rippleColor = "rgba(255, 255, 255, 0.2)",
  rippleDuring = 800,
  type = "button"
}) => (
  <Ripples 
    className="w-full h-full block rounded-[inherit] overflow-hidden" // Forzar la herencia de los bordes redondeados y evitar que se cambien estilos no deseados
    color={rippleColor}
    during={rippleDuring}
    disabled={disabled}
  >
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-full ${className}`} // Asegura que el botón mantenga el tamaño correcto
    >
      {children}
    </button>
  </Ripples>
);

RippleButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  rippleColor: PropTypes.string,
  rippleDuring: PropTypes.number,
  type: PropTypes.oneOf(['button', 'submit', 'reset'])
};

export default RippleButton;
