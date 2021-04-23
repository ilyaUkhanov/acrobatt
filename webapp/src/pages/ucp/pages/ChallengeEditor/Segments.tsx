import * as React from 'react'
import {useRouter} from "../../../../hooks/useRouter";
import {useSegments} from "../../../../api/useSegments";
import {Marker, Polyline} from 'react-leaflet';
import L, {LatLng} from "leaflet";
import {calculatePointCoordOnSegment} from "../../../../utils/orthonormalCalculs";
import {useEffect, useState} from "react";
import {Segment} from "../../../../api/entities/Segment";
import Obstacles from "./Obstacles";
import Obstacle from "../../../../api/entities/Obstacle";
import useMapEditor from "../../../../hooks/useMapEditor";

type Props = {
  challengeId: number
}

const Segments = (props: Props) => {
  const {
    challengeId,
  } = props

  const {selectedObject, setSelectedObject, scale} = useMapEditor()

  /***********************
   **  Segments Display **
   ***********************/
  const segmentList = useSegments(challengeId)

  return (
    <>
      {/* SEGMENTS */
        segmentList.isSuccess &&
        segmentList.data.map(segment => {
          let coords: LatLng[] = segment.attributes.coordinates.map((coord) => {
            return L.latLng(coord.y, coord.x);
          });

          return (
            <React.Fragment key={segment.id}>
              <Obstacles
                eventHandlers={{
                  click(e) {
                    let obstacle: Obstacle = e.target.options['data-obstacle']
                    setSelectedObject(obstacle)
                    setObstacleDistance(obstacle.attributes.position*100)
                  }
                }}
                segment={segment}
                scale={scale}
              />
              <Polyline
                weight={5}
                bubblingMouseEvents={false}
                positions={coords}
                eventHandlers={{
                  click(e) {
                    setSelectedObject(segment)
                    console.log(selectedObject)
                    L.DomEvent.stopPropagation(e);
                  }
                }}
              />
              {
                selectedObject instanceof Segment &&
                selectedObject.id == segment.id &&
                <Polyline
                    weight={6}
                    stroke
                    fillOpacity={0}
                    fillColor="transparent"
                    color="#E3C945"
                    positions={coords}
                />
              }
            </React.Fragment>
          )
        })
      }
    </>
  )
}

export default Segments