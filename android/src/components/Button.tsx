import React from "react";
import { StyleProp, ViewStyle, StyleSheet, TouchableOpacity, Text, } from "react-native";
import { getColor, getLightColor, colorList, BaseColors } from "../styles/colors";
import { Icon } from 'react-native-elements'

let createStyles = (padding: number, width: number, center: boolean, style?: any, color?: BaseColors): any => {

    let baseColor = colorList.brand;
    let darkColor = colorList.brand;
    let titleColor = "white";

    if (color !== undefined) {
        baseColor = getColor(color);
        darkColor = getLightColor(color);
        titleColor = color === "light" ? colorList.brand : "white";
    }

    return StyleSheet.create({
        container: {
            backgroundColor: baseColor,
            borderColor: darkColor,
            borderWidth: 1,
            borderRadius: 10,
            padding: padding,
            margin: 10,
            marginLeft: center ? "auto" : null,
            marginRight: center ? "auto" : null,
            width: width,
        },
        title: {
            fontSize: 16,
            color: titleColor,
            textAlign: "center",
        },
        ...style,
    });
};

type Props = {
    onPress: () => void;
    style?: StyleProp<ViewStyle>;
    title?: string;
    color?: BaseColors;
    icon?: string;
    padding?: number;
    width?: number;
    iconSize?: number;
    center?: boolean;
};

const Button = ({ onPress, style, title, color, icon, iconSize, padding, width, center }: Props) => {
    iconSize = iconSize === undefined ? 24 : iconSize;
    padding = padding === undefined ? 8 : padding;
    width = width === undefined ? 140 : width;
    center = center === undefined ? false : center;

    const styles = createStyles(padding, width, center, style, color);

    return (
        <>
            <TouchableOpacity style={styles.container} onPress={onPress}>

                {title !== undefined ?
                    (<Text style={styles.title}>{title}</Text>)
                    : null}

                {icon !== undefined ?
                    (<Icon name={icon} size={iconSize} color={styles.title.color} />)
                    : null}
            </TouchableOpacity>
        </>
    );
};

export default Button;
