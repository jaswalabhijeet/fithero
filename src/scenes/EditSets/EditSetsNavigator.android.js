/* @flow */

import * as React from 'react';
import { Keyboard, PixelRatio, StyleSheet, View } from 'react-native';
import TabbedViewPager from 'react-native-tabbed-view-pager-android';
import { AndroidBackHandler } from 'react-navigation-backhandler';

import withTheme from '../../utils/theme/withTheme';
import i18n from '../../utils/i18n';
import { dateToString, getDatePrettyFormat, getToday } from '../../utils/date';
import { getExerciseName } from '../../utils/exercises';
import ExerciseHistory from './ExerciseHistory';
import EditSetsScreen from './EditSetsScreen';
import Screen from '../../components/Screen';
import { getDefaultNavigationOptions } from '../../utils/navigation';
import type { NavigationType } from '../../types';
import type { ThemeType } from '../../utils/theme/withTheme';

const getContentComponent = index =>
  index === 0 ? EditSetsScreen : ExerciseHistory;

type NavigationObjectType = {
  navigation: NavigationType<{
    day: string,
    exerciseKey: string,
    exerciseName?: string,
  }>,
};

type NavigationOptions = NavigationObjectType & {
  screenProps: {
    theme: ThemeType,
  },
};

type Props = NavigationObjectType & {
  theme: ThemeType,
};

type State = {
  selectedPage: number,
};

class EditSetsNavigator extends React.Component<Props, State> {
  viewPager: typeof TabbedViewPager;
  tabNames: Array<string>;

  static navigationOptions = ({
    navigation,
    screenProps,
  }: NavigationOptions) => ({
    ...getDefaultNavigationOptions(screenProps.theme),
    headerTitle: getExerciseName(
      navigation.state.params.exerciseKey,
      navigation.state.params.exerciseName
    ),
  });

  constructor(props: Props) {
    super(props);
    this.state = {
      selectedPage: 0,
    };
    this.tabNames = [
      getDatePrettyFormat(
        props.navigation.state.params.day,
        dateToString(getToday()),
        PixelRatio.get() < 2,
        true
      ),
      i18n.t('history'),
    ];
  }

  onBackButtonPressAndroid = () => {
    if (this.state.selectedPage === 0) {
      return false;
    }
    this.setState({ selectedPage: 0 });
    this.viewPager.setPage(0);
    return true;
  };

  onPageSelected = (position: number) => {
    this.setState({ selectedPage: position });
  };

  render() {
    const { navigation, theme } = this.props;

    return (
      <Screen>
        <AndroidBackHandler onBackPress={this.onBackButtonPressAndroid}>
          <TabbedViewPager
            tabMode="fixed"
            tabBackground={theme.colors.background}
            tabIndicatorColor={theme.colors.text}
            tabIndicatorHeight={2}
            tabTextColor={theme.colors.secondaryText}
            tabSelectedTextColor={theme.colors.text}
            tabElevation={0}
            tabNames={this.tabNames}
            style={styles.tabs}
            initialPage={0}
            onPageSelected={event => {
              Keyboard.dismiss();
              this.onPageSelected(event.nativeEvent.position);
            }}
            ref={r => {
              this.viewPager = r;
            }}
          >
            {this.tabNames.map((tabName, i) => {
              const ContentComponent = getContentComponent(i);
              return (
                <View key={i} style={styles.content}>
                  {/* $FlowFixMe */}
                  <ContentComponent
                    navigation={navigation}
                    selectedPage={this.state.selectedPage}
                  />
                </View>
              );
            })}
          </TabbedViewPager>
        </AndroidBackHandler>
      </Screen>
    );
  }
}

const styles = StyleSheet.create({
  tabs: {
    flex: 1,
  },
  content: {
    // TopBar height
    paddingBottom: 48,
  },
});

export default withTheme(EditSetsNavigator);
