import bd_divisions from "@/src/data/bd-geo-location/bd-division.json";
import bd_districts from "@/src/data/bd-geo-location/bd-districts.json";
import bd_upazilas from "@/src/data/bd-geo-location/bd-upazilas.json";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { string } from "zod";

export default function BdAddress({ control, setValue }) {
  // divisions
  const [selectDivision, setSelectDivision] = useState(null);
  const divisionId = bd_divisions?.divisions?.find(
    (item) => item.bn_name === selectDivision,
  );
  // districts
  const districts = bd_districts?.districts?.filter(
    (item) => item?.division_id === divisionId?.id,
  );
  const [selectDistrict, setSelectDistrict] = useState(null);
  const districtId = bd_districts?.districts?.find(
    (item) => item.bn_name === selectDistrict,
  );
  // upazila
  const upazilas = bd_upazilas?.upazilas?.filter(
    (item) => item?.district_id === districtId?.id,
  );

  return (
    <div className="flex items-center justify-left gap-10">
      {/* divison */}
      <div className="flex items-center gap-1  ">
        <h5>বিভাগ :</h5>
        <Select
          className="border-3 p-5 bg-green-500"
          onValueChange={(value) => {
            setSelectDivision(value);
            setValue("division", value);
          }}
        >
          <SelectTrigger className={`cursor-pointer`}>
            <SelectValue placeholder="Select Division" />
          </SelectTrigger>

          <SelectContent className={"p-2"}>
            {bd_divisions.divisions.map((item) => (
              <SelectItem key={item.id} value={String(item.bn_name)}>
                {item.bn_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* district */}
      <div className="flex items-center gap-1 ">
        <h5>জেলা :</h5>
        <Select
          onValueChange={(value) => {
            setSelectDistrict(value);
            setValue("district", value);
          }}
        >
          <SelectTrigger className={`cursor-pointer`}>
            <SelectValue placeholder="Select Division" />
          </SelectTrigger>

          <SelectContent className={"p-2"}>
            {districts.map((item) => (
              <SelectItem key={item.id} value={String(item.bn_name)}>
                {item.bn_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* upazila */}
      <div className="flex items-center gap-1 ">
        <h5> উপজেলা :</h5>
        <Select
          onValueChange={(value) => {
            setValue("upazila", value);
          }}
        >
          <SelectTrigger className={`cursor-pointer`}>
            <SelectValue placeholder="Select Division" />
          </SelectTrigger>

          <SelectContent className={"p-2"}>
            {upazilas.map((item) => (
              <SelectItem key={item.id} value={String(item.bn_name)}>
                {item.bn_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
